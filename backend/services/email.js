const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail({ to, subject, html, text }) {
        try {
            const mailOptions = {
                from: `"Learnify" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return result;
        } catch (error) {
            console.error('Email send error:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendWelcomeEmail(user) {
        return this.sendEmail({
            to: user.email,
            subject: 'Welcome to Learnify!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #3b82f6;">Welcome to Learnify!</h1>
                    <p>Hi ${user.name},</p>
                    <p>Thank you for joining Learnify! We're excited to have you on board.</p>
                    <p>Start exploring our AI-powered learning platform and discover:</p>
                    <ul>
                        <li>Interactive AI-generated quizzes</li>
                        <li>Personalized learning paths</li>
                        <li>24/7 AI tutoring support</li>
                        <li>Multi-language content</li>
                    </ul>
                    <p>Happy learning!</p>
                    <p>The Learnify Team</p>
                </div>
            `
        });
    }
}

const emailService = new EmailService();

module.exports = {
    sendEmail: (options) => emailService.sendEmail(options),
    sendWelcomeEmail: (user) => emailService.sendWelcomeEmail(user)
};