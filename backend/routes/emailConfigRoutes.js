/**
 * emailConfigRoutes.js
 * ─────────────────────
 * GET  /api/admin/email-config        — admin get config
 * POST /api/admin/email-config        — admin save config
 * POST /api/admin/email-config/test   — admin test email
 *
 * GET  /api/vendor/email-config       — vendor get own config
 * POST /api/vendor/email-config       — vendor save own config
 * POST /api/vendor/email-config/test  — vendor test own email
 *
 * GET  /api/user/email-config         — user get own config
 * POST /api/user/email-config         — user save own config
 * POST /api/user/email-config/test    — user test own email
 */

const express     = require('express');
const EmailConfig = require('../models/EmailConfig');
const { sendTestMail } = require('../utils/mailerService');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router({ strict: false });

// ── Shared helpers ────────────────────────────────────────────────────────────
const maskConfig = (cfg) => ({
  provider:       cfg.provider,
  smtpUser:       cfg.smtpUser,
  smtpPass:       cfg.smtpPass ? '••••••••••••••••' : '',
  smtpHost:       cfg.smtpHost,
  smtpPort:       cfg.smtpPort,
  smtpSecure:     cfg.smtpSecure,
  fromName:       cfg.fromName,
  fromEmail:      cfg.fromEmail,
  isEnabled:      cfg.isEnabled,
  lastTestedAt:   cfg.lastTestedAt,
  lastTestStatus: cfg.lastTestStatus,
  lastTestError:  cfg.lastTestError,
  updatedAt:      cfg.updatedAt,
});

const getOrCreateConfig = async (ownerId = null, ownerRole = 'admin') => {
  let cfg = await EmailConfig.findOne({ ownerId });
  if (!cfg) cfg = await EmailConfig.create({ ownerId, ownerRole });
  return cfg;
};

const saveConfig = async (req, res, ownerId = null, ownerRole = 'admin') => {
  try {
    const {
      provider, smtpUser, smtpPass,
      smtpHost, smtpPort, smtpSecure,
      fromName, fromEmail, isEnabled,
    } = req.body;

    const validProvider = ['gmail', 'zoho', 'outlook'].includes(provider) ? provider : 'gmail';

    if (!smtpUser?.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    let cfg = await EmailConfig.findOne({ ownerId });
    const isPasswordPlaceholder = smtpPass === '••••••••••••••••';

    const update = {
      provider:   validProvider,
      smtpUser:   smtpUser.trim(),
      smtpHost:   smtpHost?.trim() || 'smtp.gmail.com',
      smtpPort:   parseInt(smtpPort, 10) || 587,
      smtpSecure: Boolean(smtpSecure),
      fromName:   fromName?.trim() || 'EI RFID Solutions',
      fromEmail:  fromEmail?.trim() || smtpUser.trim(),
      isEnabled:  isEnabled !== undefined ? Boolean(isEnabled) : true,
    };

    if (smtpPass && !isPasswordPlaceholder) {
      update.smtpPass = smtpPass;
    }

    if (cfg) {
      Object.assign(cfg, update);
      await cfg.save();
    } else {
      cfg = await EmailConfig.create({ ...update, ownerId, ownerRole, smtpPass: smtpPass || '' });
    }

    res.json({ success: true, message: 'Email configuration saved.', config: maskConfig(cfg) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const testConfig = async (req, res, ownerId = null) => {
  try {
    const { recipientEmail } = req.body;
    if (!recipientEmail?.trim()) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }

    const cfg = await EmailConfig.findOne({ ownerId });
    if (!cfg || !cfg.smtpUser || !cfg.smtpPass) {
      return res.status(400).json({ success: false, message: 'Email not configured yet. Save your settings first.' });
    }

    try {
      await sendTestMail(cfg, recipientEmail.trim());
      cfg.lastTestedAt   = new Date();
      cfg.lastTestStatus = 'success';
      cfg.lastTestError  = '';
      await cfg.save();
      res.json({ success: true, message: `Test email sent successfully to ${recipientEmail}.` });
    } catch (sendErr) {
      cfg.lastTestedAt   = new Date();
      cfg.lastTestStatus = 'failed';
      cfg.lastTestError  = sendErr.message;
      await cfg.save();
      res.status(500).json({ success: false, message: `Test email failed: ${sendErr.message}` });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — ownerId = null (system-wide)
// ══════════════════════════════════════════════════════════════════════════════

router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const cfg = await getOrCreateConfig(null, 'admin');
    res.json({ success: true, config: maskConfig(cfg) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, restrictTo('admin'), (req, res) =>
  saveConfig(req, res, null, 'admin')
);

router.post('/test', protect, restrictTo('admin'), (req, res) =>
  testConfig(req, res, null)
);

// ══════════════════════════════════════════════════════════════════════════════
// VENDOR ROUTES — ownerId = vendor's user _id
// ══════════════════════════════════════════════════════════════════════════════

router.get('/vendor', protect, restrictTo('vendor'), async (req, res) => {
  try {
    const cfg = await getOrCreateConfig(req.user._id, 'vendor');
    res.json({ success: true, config: maskConfig(cfg) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/vendor', protect, restrictTo('vendor'), (req, res) =>
  saveConfig(req, res, req.user._id, 'vendor')
);

router.post('/vendor/test', protect, restrictTo('vendor'), (req, res) =>
  testConfig(req, res, req.user._id)
);

// ══════════════════════════════════════════════════════════════════════════════
// USER ROUTES — ownerId = user's _id
// ══════════════════════════════════════════════════════════════════════════════

router.get('/user', protect, restrictTo('user'), async (req, res) => {
  try {
    const cfg = await getOrCreateConfig(req.user._id, 'user');
    res.json({ success: true, config: maskConfig(cfg) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/user', protect, restrictTo('user'), (req, res) =>
  saveConfig(req, res, req.user._id, 'user')
);

router.post('/user/test', protect, restrictTo('user'), (req, res) =>
  testConfig(req, res, req.user._id)
);

module.exports = router;