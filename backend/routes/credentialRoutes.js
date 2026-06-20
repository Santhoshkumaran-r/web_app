const express    = require('express');
const crypto     = require('crypto');
const User       = require('../models/User');
const { sendMail } = require('../utils/mailerService');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
const generatePassword = () => {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const special = '!@#$%&*?';
  const all     = upper + lower + digits + special;
  const rand    = (str) => str[crypto.randomInt(str.length)];
  const mandatory = [rand(upper), rand(lower), rand(digits), rand(special)];
  const rest      = Array.from({ length: 8 }, () => rand(all));
  const combined  = [...mandatory, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join('');
};

const sendCredentialEmail = async ({ recipientName, recipientEmail, password, role, tokenLimit, loginUrl, ownerId }) => {
  const roleLabel   = role.charAt(0).toUpperCase() + role.slice(1);
  const accentColor = role === 'vendor' ? '#0e7a5a' : '#a16207';
  const paleBg      = role === 'vendor' ? '#e8f5e9' : '#fffde7';
  const border      = role === 'vendor' ? '#a5d6a7' : '#ffe082';
  const limitRow    = tokenLimit != null
    ? `<tr><td style="padding:10px 0;font-size:13px;color:#6b7280;">Token Limit</td>
       <td style="padding:10px 0;font-size:13px;font-weight:700;color:#111827;text-align:right;">${tokenLimit} tokens</td></tr>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;padding:0 16px 40px;">
  <div style="background:linear-gradient(135deg,${accentColor},${accentColor}cc);border-radius:12px 12px 0 0;padding:28px 36px;text-align:center;">
    <p style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin:0 0 6px;">EI RFID Solutions</p>
    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0;">Your ${roleLabel} Account Credentials</h1>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px;">
    <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.7;">
      Hello <strong>${recipientName}</strong>, your <strong>${roleLabel}</strong> account has been created on EI RFID Solutions.
    </p>
    <div style="background:${paleBg};border:2px solid ${border};border-radius:10px;padding:24px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accentColor};margin:0 0 14px;">Login Credentials</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 0;border-bottom:1px solid ${border};font-size:13px;color:#6b7280;width:40%;">Name</td>
            <td style="padding:10px 0;border-bottom:1px solid ${border};font-size:13px;font-weight:700;color:#111827;text-align:right;">${recipientName}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid ${border};font-size:13px;color:#6b7280;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid ${border};font-size:13px;font-weight:700;color:#111827;text-align:right;font-family:monospace;">${recipientEmail}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:${limitRow ? `1px solid ${border}` : 'none'};font-size:13px;color:#6b7280;">Password</td>
            <td style="padding:10px 0;border-bottom:${limitRow ? `1px solid ${border}` : 'none'};font-size:13px;font-weight:700;color:#111827;text-align:right;font-family:monospace;">${password}</td></tr>
        ${limitRow}
      </table>
    </div>
    ${loginUrl ? `<div style="text-align:center;margin-bottom:24px;">
      <a href="${loginUrl}" style="display:inline-block;background:${accentColor};color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">Log in →</a>
    </div>` : ''}
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;">
      <p style="font-size:13px;color:#b91c1c;margin:0;line-height:1.7;"><strong>Security Notice:</strong> Please change your password after first login.</p>
    </div>
  </div>
  <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:18px;">EI RFID Solutions Private Limited · Automated message, do not reply.</p>
</div></body></html>`;

  const result = await sendMail({
    to:      recipientEmail,
    subject: `Your ${roleLabel} Account Credentials – EI RFID Solutions`,
    html,
    ownerId: ownerId || null,
  });
  if (!result.ok) throw new Error(result.error);
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — manage vendors and users
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/admin/credentials/create — admin creates a vendor or user
router.post('/create', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { name, email, accountType, tokenLimit } = req.body;
    const role = accountType;

    if (!name?.trim())  return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!email?.trim()) return res.status(400).json({ success: false, message: 'Email is required.' });
    if (!['vendor', 'user'].includes(role))
      return res.status(400).json({ success: false, message: 'Account type must be "vendor" or "user".' });
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });

    // Admin MUST set a token limit for vendors and users — no unlimited
    if (tokenLimit == null || tokenLimit === '')
      return res.status(400).json({ success: false, message: 'Token limit is required. Admin must set a limit for all vendors and users.' });

    const parsedLimit = parseInt(tokenLimit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1)
      return res.status(400).json({ success: false, message: 'Token limit must be a positive number.' });

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing)
      return res.status(409).json({ success: false, message: `An account with this email already exists (role: ${existing.role}).` });

    const plainPassword = generatePassword();
    const newUser = await User.create({
      name: name.trim(), email: normalizedEmail, password: plainPassword,
      role, isActive: true, tokenLimit: parsedLimit, tokensUsed: 0,
    });

    let emailSent = false;
    try {
      await sendCredentialEmail({
        recipientName: name.trim(), recipientEmail: normalizedEmail,
        password: plainPassword, role, tokenLimit: parsedLimit,
        loginUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`,
        ownerId: null, // admin email config
      });
      emailSent = true;
    } catch (err) {
      console.error('[credentialRoutes] Email failed:', err.message);
    }

    return res.status(201).json({
      success: true,
      message: emailSent ? `${role} account created and credentials emailed.` : `Account created but email failed.`,
      emailSent,
      account: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, tokenLimit: newUser.tokenLimit, tokensUsed: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/credentials/list
router.get('/list', protect, restrictTo('admin'), async (req, res) => {
  try {
    const filter = { role: { $in: ['vendor', 'user'] } };
    if (req.query.role && ['vendor', 'user'].includes(req.query.role)) filter.role = req.query.role;
    const accounts = await User.find(filter)
      .select('name email role isActive tokenLimit tokensUsed vendorId createdAt')
      .populate('vendorId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/credentials/limit/:id — admin updates token limit
router.patch('/limit/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { tokenLimit } = req.body;
    if (tokenLimit == null || tokenLimit === '')
      return res.status(400).json({ success: false, message: 'Token limit is required.' });

    const parsedLimit = parseInt(tokenLimit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 0)
      return res.status(400).json({ success: false, message: 'Token limit must be a non-negative number.' });

    const user = await User.findByIdAndUpdate(
      req.params.id, { tokenLimit: parsedLimit },
      { new: true, select: 'name email role tokenLimit tokensUsed' }
    );
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });
    res.json({ success: true, account: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/credentials/history/:id
router.delete('/history/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });
    if (!['vendor', 'user'].includes(user.role))
      return res.status(403).json({ success: false, message: 'Cannot delete admin accounts from here.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VENDOR ROUTES — vendor manages their own users
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/vendor/credentials/create-user
router.post('/create-user', protect, restrictTo('vendor'), async (req, res) => {
  try {
    const { name, email, tokenLimit } = req.body;
    const vendor = await User.findById(req.user._id);

    if (!name?.trim())  return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!email?.trim()) return res.status(400).json({ success: false, message: 'Email is required.' });
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });

    // Token limit is REQUIRED for vendor creating users — no unlimited
    if (tokenLimit == null || tokenLimit === '')
      return res.status(400).json({ success: false, message: 'Token allocation is required. You must set a limit for each user.' });

    const parsedLimit = parseInt(tokenLimit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1)
      return res.status(400).json({ success: false, message: 'Token allocation must be a positive number.' });

    // Check vendor pool:
    // available = vendorLimit - totalAllocatedToUsers - tokensUsedByVendorDirectly
    if (vendor.tokenLimit !== null) {
      const vendorUsers    = await User.find({ vendorId: vendor._id, role: 'user' });
      const totalAllocated = vendorUsers.reduce((sum, u) => sum + (u.tokenLimit || 0), 0);
      // Vendor's own used tokens count against their pool too
      const vendorOwnUsed  = vendor.tokensUsed || 0;
      const available      = vendor.tokenLimit - totalAllocated - vendorOwnUsed;

      if (parsedLimit > available) {
        return res.status(400).json({
          success: false,
          message: `Cannot allocate ${parsedLimit} tokens. You only have ${available} tokens available (${vendor.tokenLimit} total − ${totalAllocated} allocated to users − ${vendorOwnUsed} used by you).`,
          vendorTotal:      vendor.tokenLimit,
          alreadyAllocated: totalAllocated,
          vendorOwnUsed,
          available,
        });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing)
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

    const plainPassword = generatePassword();
    const newUser = await User.create({
      name: name.trim(), email: normalizedEmail, password: plainPassword,
      role: 'user', isActive: true,
      tokenLimit: parsedLimit, tokensUsed: 0,
      vendorId: vendor._id,
    });

    let emailSent = false;
    try {
      await sendCredentialEmail({
        recipientName: name.trim(), recipientEmail: normalizedEmail,
        password: plainPassword, role: 'user', tokenLimit: parsedLimit,
        loginUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`,
        ownerId: vendor._id, // use vendor's own email config
      });
      emailSent = true;
    } catch (err) {
      console.error('[vendor create-user] Email failed:', err.message);
    }

    res.status(201).json({
      success: true,
      message: emailSent ? 'User account created and credentials emailed.' : 'Account created but email failed.',
      emailSent,
      account: { id: newUser._id, name: newUser.name, email: newUser.email, role: 'user', tokenLimit: newUser.tokenLimit, tokensUsed: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/vendor/credentials/my-users
router.get('/my-users', protect, restrictTo('vendor'), async (req, res) => {
  try {
    const users = await User.find({ vendorId: req.user._id, role: 'user' })
      .select('name email role isActive tokenLimit tokensUsed createdAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/vendor/credentials/pool
router.get('/pool', protect, restrictTo('vendor'), async (req, res) => {
  try {
    const vendor      = await User.findById(req.user._id).select('tokenLimit tokensUsed');
    const vendorUsers = await User.find({ vendorId: req.user._id, role: 'user' });
    const totalAllocated = vendorUsers.reduce((sum, u) => sum + (u.tokenLimit || 0), 0);
    const vendorOwnUsed  = vendor.tokensUsed || 0;

    // Available = total limit - allocated to users - used by vendor directly
    const available = vendor.tokenLimit !== null
      ? Math.max(0, vendor.tokenLimit - totalAllocated - vendorOwnUsed)
      : null;

    res.json({
      success:         true,
      vendorLimit:     vendor.tokenLimit,
      vendorUsed:      vendorOwnUsed,
      totalAllocated,
      available,
      usersCount:      vendorUsers.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/vendor/credentials/user-limit/:id
router.patch('/user-limit/:id', protect, restrictTo('vendor'), async (req, res) => {
  try {
    const { tokenLimit } = req.body;
    const targetUser = await User.findOne({ _id: req.params.id, vendorId: req.user._id, role: 'user' });
    if (!targetUser)
      return res.status(404).json({ success: false, message: 'User not found under your account.' });

    // Required — no unlimited for vendor's users
    if (tokenLimit == null || tokenLimit === '')
      return res.status(400).json({ success: false, message: 'Token limit is required.' });

    const parsedLimit = parseInt(tokenLimit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 0)
      return res.status(400).json({ success: false, message: 'Token limit must be a non-negative number.' });

    // Check vendor pool (exclude current user's existing allocation)
    const vendor         = await User.findById(req.user._id);
    const vendorUsers    = await User.find({ vendorId: req.user._id, role: 'user', _id: { $ne: targetUser._id } });
    const otherAllocated = vendorUsers.reduce((sum, u) => sum + (u.tokenLimit || 0), 0);
    const vendorOwnUsed  = vendor.tokensUsed || 0;
    const available      = vendor.tokenLimit !== null
      ? vendor.tokenLimit - otherAllocated - vendorOwnUsed
      : null;

    if (available !== null && parsedLimit > available) {
      return res.status(400).json({
        success: false,
        message: `Cannot allocate ${parsedLimit} tokens. Only ${available} tokens available after other users and your own usage.`,
      });
    }

    targetUser.tokenLimit = parsedLimit;
    await targetUser.save();

    res.json({
      success: true,
      account: { _id: targetUser._id, name: targetUser.name, email: targetUser.email, tokenLimit: parsedLimit, tokensUsed: targetUser.tokensUsed },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/vendor/credentials/user/:id
router.delete('/user/:id', protect, restrictTo('vendor'), async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, vendorId: req.user._id, role: 'user' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found under your account.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;