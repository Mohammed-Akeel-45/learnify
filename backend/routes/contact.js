const express = require('express');
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');

const router = express.Router();

// Create reusable transporter
function createTransporter() {
  return nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
}

// @route   POST /api/contact
// @desc    Submit a contact form & send email to admin
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    // Save to database
    const contact = await Contact.create({ name, email, subject, message });

    // Send email to admin
    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
      try {
        const transporter = createTransporter();

        await transporter.sendMail({
          from: `"Learnify Contact" <${process.env.MAIL_USER}>`,
          to: process.env.CONTACT_EMAIL || process.env.MAIL_USER,
          replyTo: email,
          subject: `[Learnify Contact] ${subject}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0e27;color:#e8eaf6;border-radius:12px;">
              <h2 style="color:#667eea;margin-bottom:20px;">📬 New Contact Message</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#9fa8da;width:80px;"><strong>Name:</strong></td><td style="padding:8px 0;">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#9fa8da;"><strong>Email:</strong></td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#667eea;">${email}</a></td></tr>
                <tr><td style="padding:8px 0;color:#9fa8da;"><strong>Subject:</strong></td><td style="padding:8px 0;">${subject}</td></tr>
              </table>
              <div style="margin-top:16px;padding:16px;background:#111638;border-radius:8px;border-left:3px solid #667eea;">
                <p style="color:#9fa8da;margin:0 0 4px;font-size:12px;">Message:</p>
                <p style="margin:0;line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              <p style="margin-top:20px;font-size:12px;color:#616896;">Sent from Learnify Contact Form</p>
            </div>
          `
        });
      } catch (mailError) {
        console.error('Email sending failed:', mailError.message);
        // Still return success since message was saved to DB
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been sent. We will get back to you shortly.',
      data: contact
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
