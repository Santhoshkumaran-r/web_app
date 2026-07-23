/**
 * mailerService.js
 * -----------------
 * Sends all system emails.
 * - sendMail({ to, subject, html, ownerId })
 *   If ownerId is provided, uses that vendor/user's email config.
 *   Falls back to admin (system-wide) config if not found.
 */

const nodemailer  = require('nodemailer');
const EmailConfig = require('../models/EmailConfig');

const buildTransporter = (cfg) => {
  return nodemailer.createTransport({
    host:   cfg.smtpHost || 'smtp.gmail.com',
    port:   cfg.smtpPort || 587,
    secure: cfg.smtpSecure || false,
    auth:   { user: cfg.smtpUser, pass: cfg.smtpPass },
  });
};

// Get config by ownerId (null = admin system config)
const getConfig = async (ownerId = null) => {
  let cfg = await EmailConfig.findOne({ ownerId });
  if (!cfg) cfg = await EmailConfig.create({ ownerId });
  return cfg;
};

/**
 * Send an email.
 * @param {object} opts
 * @param {string}   opts.to        Recipient email
 * @param {string}   opts.subject   Subject line
 * @param {string}   opts.html      HTML body
 * @param {string}   [opts.text]    Plain-text fallback
 * @param {ObjectId} [opts.ownerId] Vendor/user ID — uses their config if set.
 *                                  Falls back to admin config if not configured.
 */
const sendMail = async ({ to, subject, html, text, ownerId = null }) => {
  let cfg = null;

  // Try owner's own config first (vendor or user)
  if (ownerId) {
    const ownerCfg = await EmailConfig.findOne({ ownerId });
    if (ownerCfg && ownerCfg.smtpUser && ownerCfg.smtpPass) {
      cfg = ownerCfg;
    }
  }

  // Fall back to admin system config
  if (!cfg) {
    const adminCfg = await EmailConfig.findOne({ ownerId: null });
    if (adminCfg && adminCfg.smtpUser && adminCfg.smtpPass) {
      cfg = adminCfg;
    }
  }

  if (!cfg) {
    return { ok: false, error: 'Email not configured. Set it up in Email Configuration.' };
  }

  const transporter = buildTransporter(cfg);
  const fromAddress = `"${cfg.fromName || 'EI RFID Solutions'}" <${cfg.fromEmail || cfg.smtpUser}>`;
  try {
    const info = await transporter.sendMail({
      from: fromAddress, to, subject, html,
      ...(text ? { text } : {}),
    });
    return { ok: true, info, fromName: cfg.fromName || 'EI RFID Solutions' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

// Test helper
const sendTestMail = async (cfg, recipientEmail) => {
  if (!cfg.smtpUser || !cfg.smtpPass) throw new Error('SMTP credentials are empty.');

  const transporter = buildTransporter(cfg);
  const fromAddress = `"${cfg.fromName || 'EI RFID Solutions'}" <${cfg.fromEmail || cfg.smtpUser}>`;
  
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
    <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#1976d2,#1565c0);padding:24px 32px;text-align:center;">
        <h1 style="color:#fff;font-size:20px;margin:0;">✅ Test Email</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
          Your email configuration is working correctly.
        </p>
        <p style="font-size:13px;color:#6b7280;margin:0;">
          Provider: <strong>${cfg.provider ? cfg.provider.charAt(0).toUpperCase() + cfg.provider.slice(1) : 'Gmail'}</strong><br>
          Sent from: <strong>${fromAddress}</strong><br>
          Sent at: <strong>${new Date().toLocaleString()}</strong>
        </p>
      </div>
      <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="font-size:12px;color:#9ca3af;margin:0;">EI RFID Solutions · Email Configuration Test</p>
      </div>
    </div></body></html>`;

  await transporter.sendMail({
    from: fromAddress, to: recipientEmail,
    subject: 'EI RFID Solutions — Email Configuration Test', html,
  });
};

module.exports = { sendMail, sendTestMail, getConfig, buildTransporter }; 