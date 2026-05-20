const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This must be a Gmail App Password, not your real password
  },
});

/**
 * Send an email
 * @param {string} to      - recipient email
 * @param {string} subject - email subject
 * @param {string} html    - HTML body content
 */
const sendMail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendMail;
