const nodemailer = require('nodemailer');

/**
 * Centralized Nodemailer transporter — works on Render production.
 *
 * Key fixes for Render:
 * 1. Force IPv4 (family: 4) — Render's IPv6 outbound is often blocked
 * 2. Explicit TLS settings — avoid self-signed cert rejections
 * 3. Connection & greeting timeouts — Render can be slow on outbound SMTP
 * 4. Connection pooling — reuses connections for multiple sends
 * 5. Detailed error logging for production debugging
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!user || !pass) {
    console.error('[MAILER] MAIL_USER or MAIL_PASS is not set! Emails will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT, 10) || 465,
    secure: true, // TLS on port 465
    family: 4, // Force IPv4 — critical for Render
    auth: { user, pass },
    // Timeouts to avoid hanging connections on Render
    connectionTimeout: 30000, // 30s to establish connection
    greetingTimeout: 30000,   // 30s for SMTP greeting
    socketTimeout: 60000,     // 60s for socket inactivity
    // Pool connections for performance
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    // TLS options for production environments
    tls: {
      // Don't fail on self-signed certs (some Render egress proxies)
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    // Debug in production (remove once confirmed working)
    logger: process.env.NODE_ENV === 'production',
    debug: process.env.MAIL_DEBUG === 'true'
  });

  return transporter;
}

/**
 * Verify SMTP connection — call on server startup to catch config issues early.
 */
async function verifyConnection() {
  const t = getTransporter();
  if (!t) {
    console.error('[MAILER] Cannot verify — transporter not configured.');
    return false;
  }
  try {
    await t.verify();
    console.log('[MAILER] ✅ SMTP connection verified successfully.');
    return true;
  } catch (err) {
    console.error('[MAILER] ❌ SMTP verification failed:', err.message);
    console.error('[MAILER] Full error:', JSON.stringify({
      code: err.code,
      command: err.command,
      response: err.response,
      responseCode: err.responseCode
    }));
    return false;
  }
}

/**
 * Send an email with full error details.
 * @param {Object} mailOptions - Standard Nodemailer mail options (from, to, subject, html, etc.)
 * @returns {Object} info from Nodemailer
 */
async function sendMail(mailOptions) {
  const t = getTransporter();
  if (!t) {
    throw new Error('Email service is not configured. Check MAIL_USER and MAIL_PASS environment variables.');
  }

  // Default "from" if not specified
  if (!mailOptions.from) {
    mailOptions.from = `"Learnify" <${process.env.MAIL_USER}>`;
  }

  try {
    const info = await t.sendMail(mailOptions);
    console.log(`[MAILER] ✅ Email sent to ${mailOptions.to} | messageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[MAILER] ❌ Failed to send email to ${mailOptions.to}:`, err.message);
    console.error('[MAILER] Full error:', JSON.stringify({
      code: err.code,
      command: err.command,
      response: err.response,
      responseCode: err.responseCode
    }));
    throw err; // Re-throw so callers can handle
  }
}

module.exports = { getTransporter, verifyConnection, sendMail };
