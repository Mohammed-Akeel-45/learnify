const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const emailValidator = require('deep-email-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendMail } = require('../services/mailer');

const router = express.Router();

// ============ HELPERS ============

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Hash OTP before storing
function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// Send OTP email (registration)
async function sendRegistrationOTP(email, otp, name) {
  await sendMail({
    to: email,
    subject: 'Learnify — Verify Your Email',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0e27;color:#e8eaf6;border-radius:16px;">
        <h2 style="color:#667eea;margin:0 0 8px;">🔐 Email Verification</h2>
        <p style="color:#9fa8da;margin:0 0 24px;">Hi ${name}, use the OTP below to verify your email.</p>
        <div style="background:#111638;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#667eea;">${otp}</span>
        </div>
        <p style="color:#9fa8da;font-size:13px;margin:0 0 4px;">This code expires in <strong>15 minutes</strong>.</p>
        <p style="color:#616896;font-size:12px;margin:0;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  });
}

// Send OTP email (password reset)
async function sendPasswordResetOTP(email, otp, name) {
  await sendMail({
    to: email,
    subject: 'Learnify — Password Reset OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0e27;color:#e8eaf6;border-radius:16px;">
        <h2 style="color:#667eea;margin:0 0 8px;">🔐 Password Reset</h2>
        <p style="color:#9fa8da;margin:0 0 24px;">Hi ${name}, use the OTP below to reset your password.</p>
        <div style="background:#111638;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#667eea;">${otp}</span>
        </div>
        <p style="color:#9fa8da;font-size:13px;margin:0 0 4px;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#616896;font-size:12px;margin:0;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  });
}

// Simple in-memory rate limiter for auth endpoints
const rateLimitMap = new Map();
function rateLimit(key, maxAttempts, windowMs) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (entry && now - entry.startTime < windowMs) {
    if (entry.count >= maxAttempts) {
      return false; // rate limited
    }
    entry.count++;
  } else {
    rateLimitMap.set(key, { count: 1, startTime: now });
  }
  return true;
}

// Cleanup old rate limit entries every 10 min
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now - val.startTime > 600000) rateLimitMap.delete(key);
  }
}, 600000);

// ============ ROUTES ============

// @route   POST /api/auth/register-send-otp
router.post('/register-send-otp', async (req, res) => {
  try {
    if (!rateLimit(req.ip + '_regotp', 3, 15 * 60 * 1000)) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again later.' });
    }

    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Please provide name and email' });
    }

    // Validate email — disable MX lookup in production (Render DNS can fail)
    const isProduction = process.env.NODE_ENV === 'production';
    const { valid, reason } = await emailValidator.validate({
      email: email,
      validateRegex: true,
      validateMx: !isProduction, // MX lookup fails on Render
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: false
    });
    if (!valid) {
      console.warn(`[AUTH] Email validation failed for ${email}: ${reason}`);
      return res.status(400).json({ success: false, message: 'Please provide a valid, deliverable email address' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const otp = generateOTP();

    try {
      await sendRegistrationOTP(email, otp, name);
    } catch (mailErr) {
      console.error('[AUTH] Registration OTP email failed:', mailErr.message);
      return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
    }

    const otpToken = jwt.sign(
      { name, email, hashedOtp: hashOTP(otp) }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );

    res.json({ success: true, message: 'OTP sent to email', registerToken: otpToken });
  } catch (error) {
    console.error('[AUTH] register-send-otp error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/register-verify-otp
router.post('/register-verify-otp', async (req, res) => {
  try {
    if (!rateLimit(req.ip + '_regverify', 5, 15 * 60 * 1000)) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
    }

    const { otp, registerToken } = req.body;
    if (!otp || !registerToken) {
      return res.status(400).json({ success: false, message: 'Please provide OTP and registerToken' });
    }

    let decoded;
    try {
      decoded = jwt.verify(registerToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Registration session expired or invalid' });
    }

    if (hashOTP(otp) !== decoded.hashedOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const verifiedToken = jwt.sign(
      { name: decoded.name, email: decoded.email, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ success: true, message: 'Email verified', verifiedRegisterToken: verifiedToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { password, verifiedRegisterToken } = req.body;
    if (!password || !verifiedRegisterToken) {
      return res.status(400).json({ success: false, message: 'Missing password or verification token' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(verifiedRegisterToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Registration session expired or invalid' });
    }

    if (!decoded.verified || !decoded.name || !decoded.email) {
      return res.status(400).json({ success: false, message: 'Invalid registration session' });
    }

    const existingUser = await User.findOne({ email: decoded.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name: decoded.name, email: decoded.email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login  (with brute-force protection)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Rate limit by IP + email
    const rlKey = `login:${req.ip}:${email}`;
    if (!rateLimit(rlKey, 10, 900000)) { // 10 attempts per 15 min
      return res.status(429).json({ success: false, message: 'Too many login attempts. Please try again in 15 minutes.' });
    }

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minsLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${minsLeft} minute(s).` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 min
        user.loginAttempts = 0;
        await user.save();
        return res.status(423).json({ success: false, message: 'Too many failed attempts. Account locked for 15 minutes.' });
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Reset attempts on successful login
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to user's email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email' });
    }

    // Rate limit: 3 OTP requests per email per 15 min
    const rlKey = `otp:${email}`;
    if (!rateLimit(rlKey, 3, 900000)) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Please wait 15 minutes.' });
    }

    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpiry');
    if (!user) {
      // Don't reveal if email exists — still return success
      return res.json({ success: true, message: 'If this email is registered, you will receive an OTP shortly.' });
    }

    const otp = generateOTP();
    user.resetOtp = hashOTP(otp);
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await user.save();

    // Send OTP email
    try {
      await sendPasswordResetOTP(user.email, otp, user.name);
    } catch (mailErr) {
      console.error('[AUTH] Password reset OTP email failed:', mailErr.message);
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
    }

    res.json({ success: true, message: 'If this email is registered, you will receive an OTP shortly.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and return a reset token
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    // Rate limit: 5 OTP verify attempts per email per 15 min
    const rlKey = `verify:${email}`;
    if (!rateLimit(rlKey, 5, 900000)) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Please wait 15 minutes.' });
    }

    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpiry');
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Check expiry
    if (user.resetOtpExpiry < Date.now()) {
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Compare hashed OTP
    if (hashOTP(otp) !== user.resetOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid — generate a short-lived reset token
    const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });

    // Clear OTP so it can't be reused
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'OTP verified!', resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using the reset token
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Reset session expired. Please start over.' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully! You can now login with your new password.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const Course = require('../models/Course');
    const Quiz = require('../models/Quiz');
    const Roadmap = require('../models/Roadmap');

    const totalCourses = await Course.countDocuments({ userId: req.user._id });
    const completedQuizzes = await Quiz.countDocuments({ userId: req.user._id, completed: true });
    const totalRoadmaps = await Roadmap.countDocuments({ userId: req.user._id });

    const quizzes = await Quiz.find({ userId: req.user._id, completed: true });
    const avgScore = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
      : 0;

    const courses = await Course.find({ userId: req.user._id });
    const avgProgress = courses.length > 0
      ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
      : 0;

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalCourses,
          completedQuizzes,
          totalRoadmaps,
          avgQuizScore: avgScore,
          avgCourseProgress: avgProgress
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
