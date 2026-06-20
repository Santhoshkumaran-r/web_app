/**
 * Shared token utilities used by admin, vendor, and user token routes.
 * Single source of truth — change logic here and it applies everywhere.
 */
const crypto       = require('crypto');
const User         = require('../models/User');
const { sendMail } = require('./mailerService');

const AES_KEY = process.env.TOKEN_AES_KEY || '12345678901234567890123456789012';
const AES_IV  = process.env.TOKEN_AES_IV  || '1234567890123456';

const decimalToHex = (decStr) =>
  parseInt(decStr, 10).toString(16).toUpperCase();

const generateIBeaconToken = (facilityDecimal, accessDecimal) => {
  let facilityHex = decimalToHex(String(facilityDecimal));
  if (facilityHex.length % 2 !== 0) facilityHex = '0' + facilityHex;
  facilityHex = facilityHex.padStart(4, '0');

  let accessHex = decimalToHex(String(accessDecimal));
  if (accessHex.length % 2 !== 0) accessHex = '0' + accessHex;
  accessHex = accessHex.padStart(6, '0');

  const UUIDdata   = 'E11979C10000' + facilityHex + '0000' + accessHex + '000000';
  const rawPayload = '{"Length":"1A","Type":"FF","CompanyID":"004C","Type":"02","Length":"15","UUID":"' + UUIDdata + '","Major":"0000","Minor":"0000","TxPower":"C5"}';

  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(AES_KEY, 'utf8'),
    Buffer.from(AES_IV,  'utf8')
  );
  cipher.setAutoPadding(true);

  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(rawPayload, 'utf8')),
    cipher.final(),
  ]);

  return { tokenId: encrypted.toString('base64'), UUIDdata, facilityHex, accessHex };
};


const buildEmailHTML = ({ tokenId, employeeEmail, senderName, senderRole, issuedAt, orgName }) =>
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
  '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,-apple-system,BlinkMacSystemFont,Arial,sans-serif;">' +
  '<div style="max-width:540px;margin:40px auto;padding:0 16px 40px;">' +
  '<div style="background:linear-gradient(135deg,#1976d2,#1565c0);border-radius:12px 12px 0 0;padding:28px 36px;text-align:center;">' +
  '<p style="font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin:0 0 8px;">' + orgName + '</p>' +
  '<h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0;">Your Access Token</h1></div>' +
  '<div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px;">' +
  '<p style="font-size:16px;color:#374151;margin:0 0 28px;line-height:1.7;">Hello, your access token has been issued by ' +
  '<strong style="color:#1565c0;">' + senderName + '</strong> <span style="color:#6b7280;font-size:14px;">(' + senderRole + ')</span>.</p>' +
  '<div style="background:#e3f2fd;border:2px solid #90caf9;border-radius:10px;padding:24px;margin-bottom:28px;">' +
  '<p style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1565c0;margin:0 0 14px;">Token ID</p>' +
  '<div style="background:#ffffff;padding:16px;border-radius:8px;border:1px solid #bbdefb;">' +
  '<p style="font-family:Courier New,monospace;font-size:14px;font-weight:700;color:#0d47a1;word-break:break-all;margin:0;line-height:1.9;">' + tokenId + '</p></div>' +
  '<p style="font-size:13px;color:#1565c0;margin:12px 0 0;font-style:italic;">Copy the entire token and keep it safe.</p></div>' +
  '<table style="width:100%;border-collapse:collapse;margin-bottom:28px;">' +
  '<tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;">Issued To</td>' +
  '<td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827;text-align:right;">' + employeeEmail + '</td></tr>' +
  '<tr><td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;">Issued By</td>' +
  '<td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827;text-align:right;">' + senderName + ' (' + senderRole + ')</td></tr>' +
  '<tr><td style="padding:12px 0;font-size:14px;color:#6b7280;">Issued At</td>' +
  '<td style="padding:12px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;">' + issuedAt + '</td></tr></table>' +
  '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 18px;">' +
  '<p style="font-size:14px;color:#92400e;margin:0;line-height:1.7;"><strong>Important:</strong> Keep this token confidential. Issued exclusively for <strong>' + employeeEmail + '</strong>.</p></div></div>' +
  '<p style="text-align:center;font-size:13px;color:#9ca3af;margin-top:20px;">' + orgName + ' &nbsp;·&nbsp; Automated message, do not reply.</p>' +
  '</div></body></html>';

const validateTokenRequest = (facilityCode, accessCode, employeeEmail) => {
  const fc = parseInt(facilityCode, 10);
  const ac = parseInt(accessCode,   10);
  if (facilityCode === undefined || facilityCode === '') return { error: 'Facility code is required.' };
  if (accessCode   === undefined || accessCode   === '') return { error: 'Access code is required.' };
  if (!employeeEmail)                                     return { error: 'Employee email is required.' };
  if (isNaN(fc) || fc < 0 || fc > 4095)                  return { error: 'Facility code must be 0-4095 (12-bit).' };
  if (isNaN(ac) || ac < 0 || ac > 16777215)               return { error: 'Access code must be 0-16777215 (24-bit).' };
  if (!/^\S+@\S+\.\S+$/.test(employeeEmail))              return { error: 'Invalid employee email.' };
  return { fc, ac };
};

const createTokenRouter = (TokenModel, allowedRole) => {
  const { protect, restrictTo } = require('../middleware/authMiddleware');
  const router = require('express').Router();

  // ── POST /send ─────────────────────────────────────────────────────────────
  router.post('/send', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      const { facilityCode, accessCode, employeeEmail } = req.body;
      const validated = validateTokenRequest(facilityCode, accessCode, employeeEmail);
      if (validated.error)
        return res.status(400).json({ success: false, message: validated.error });

      const { fc, ac } = validated;

      // ── Token quota check ──────────────────────────────────────────────────
      const sender = await User.findById(req.user._id);

      // For vendors — available = tokenLimit - tokensAllocatedToUsers - tokensUsedByVendorDirectly
      if (allowedRole === 'vendor' && sender.tokenLimit !== null) {
        const vendorUsers    = await User.find({ vendorId: sender._id, role: 'user' });
        const totalAllocated = vendorUsers.reduce((sum, u) => sum + (u.tokenLimit || 0), 0);
        const vendorOwn      = sender.tokenLimit - totalAllocated; // tokens vendor kept for themselves
        if (sender.tokensUsed >= vendorOwn) {
          return res.status(403).json({
            success: false, limitReached: true,
            message: `You have used all your available tokens (${vendorOwn} kept after allocating ${totalAllocated} to users). Contact admin to increase your limit.`,
            tokensUsed: sender.tokensUsed, tokenLimit: vendorOwn,
          });
        }
      }

      // For users — check their own limit
      if (sender.tokenLimit !== null && sender.tokensUsed >= sender.tokenLimit) {
        return res.status(403).json({
          success: false, limitReached: true,
          message: `You have reached your token limit of ${sender.tokenLimit}. Please contact your vendor or admin to request more tokens.`,
          tokensUsed: sender.tokensUsed, tokenLimit: sender.tokenLimit,
        });
      }

      // If sender is a user, also check their vendor's overall pool is not exhausted
      if (allowedRole === 'user' && sender.vendorId) {
        const vendor = await User.findById(sender.vendorId);
        if (vendor && vendor.tokenLimit !== null && vendor.tokensUsed >= vendor.tokenLimit) {
          return res.status(403).json({
            success: false, limitReached: true,
            message: `Your vendor's token pool is exhausted. Please contact your vendor or admin to request more tokens.`,
            tokensUsed: sender.tokensUsed, tokenLimit: sender.tokenLimit,
          });
        }
      }

      const senderName = req.user.name;
      const senderRole = allowedRole.charAt(0).toUpperCase() + allowedRole.slice(1);
      const { tokenId, UUIDdata, facilityHex, accessHex } = generateIBeaconToken(fc, ac);
      const issuedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Determine ownerId: use sender's own config if vendor/user, else null = admin config
      const mailOwnerId = (allowedRole === 'admin') ? null : req.user._id;

      // Build HTML first with a placeholder orgName; we'll get real name after sendMail
      // Actually: resolve config's fromName BEFORE sending so subject & html are correct
      const { getConfig } = require('./mailerService');
      const mailCfg = mailOwnerId
        ? await getConfig(mailOwnerId).catch(() => null) || await getConfig(null)
        : await getConfig(null);
      const orgName = mailCfg?.fromName || 'EI RFID Solutions';

      const mailResult = await sendMail({
        to:      employeeEmail,
        subject: 'Your Access Token — ' + orgName,
        html:    buildEmailHTML({ tokenId, employeeEmail, senderName, senderRole, issuedAt, orgName }),
        ownerId: mailOwnerId,
      });

      if (!mailResult.ok) {
        return res.status(500).json({ success: false, message: mailResult.error || 'Failed to send token email.' });
      }

      const record = await TokenModel.create({
        token: tokenId, facilityCode: fc, accessCode: ac,
        employeeEmail, generatedBy: req.user._id,
        generatedByEmail: req.user.email, status: 'sent',
      });

      // ── Increment tokensUsed on sender ────────────────────────────────────
      await User.findByIdAndUpdate(req.user._id, { $inc: { tokensUsed: 1 } });

      // ── If sender is a user, also increment their vendor's tokensUsed ─────
      if (allowedRole === 'user' && sender.vendorId) {
        await User.findByIdAndUpdate(sender.vendorId, { $inc: { tokensUsed: 1 } });
      }

      res.status(200).json({
        success: true,
        message: 'Token successfully sent to ' + employeeEmail,
        tokenId, UUIDdata, facilityHex, accessHex, _id: record._id,
        tokensUsed:   (sender.tokensUsed || 0) + 1,
        tokenLimit:   sender.tokenLimit,
      });
    } catch (error) {
      console.error('[' + allowedRole + ' token] send error:', error.message);
      res.status(500).json({ success: false, message: error.message || 'Failed to send token.' });
    }
  });

  // ── GET /quota ─────────────────────────────────────────────────────────────
  router.get('/quota', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('tokenLimit tokensUsed vendorId');

      let effectiveLimit = user.tokenLimit;

      // For vendors — effective limit = tokenLimit minus what's allocated to users
      if (allowedRole === 'vendor' && user.tokenLimit !== null) {
        const vendorUsers    = await User.find({ vendorId: user._id, role: 'user' });
        const totalAllocated = vendorUsers.reduce((sum, u) => sum + (u.tokenLimit || 0), 0);
        effectiveLimit = user.tokenLimit - totalAllocated;
      }

      res.json({
        success:         true,
        tokenLimit:      effectiveLimit,
        tokensUsed:      user.tokensUsed,
        tokensRemaining: effectiveLimit !== null ? Math.max(0, effectiveLimit - user.tokensUsed) : null,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ── GET /history ───────────────────────────────────────────────────────────
  router.get('/history', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      const tokens = await TokenModel.find().sort({ createdAt: -1 }).limit(50).populate('generatedBy', 'name email');
      res.status(200).json({ success: true, tokens });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ── DELETE /history/:id ────────────────────────────────────────────────────
  router.delete('/history/:id', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || id.length !== 24)
        return res.status(400).json({ success: false, message: 'Invalid token ID format.' });
      const deleted = await TokenModel.findByIdAndDelete(id);
      if (!deleted)
        return res.status(404).json({ success: false, message: 'Token record not found.' });

      // Decrement tokensUsed for the user who generated this token (min 0)
      if (deleted.generatedBy) {
        const generator = await User.findOneAndUpdate(
          { _id: deleted.generatedBy, tokensUsed: { $gt: 0 } },
          { $inc: { tokensUsed: -1 } },
          { new: true }
        );
        // If generator is a user, also decrement their vendor's pool
        if (generator && generator.vendorId) {
          await User.findOneAndUpdate(
            { _id: generator.vendorId, tokensUsed: { $gt: 0 } },
            { $inc: { tokensUsed: -1 } }
          );
        }
      }

      res.status(200).json({ success: true, message: 'Token record deleted.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ── DELETE /history ────────────────────────────────────────────────────────
  router.delete('/history', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      // Find all tokens first so we can decrement per-user counts
      const allTokens = await TokenModel.find({}, 'generatedBy');

      // Count how many tokens each user generated
      const userCounts = {};
      for (const t of allTokens) {
        if (t.generatedBy) {
          const key = t.generatedBy.toString();
          userCounts[key] = (userCounts[key] || 0) + 1;
        }
      }

      const result = await TokenModel.deleteMany({});

      // Decrement each user's tokensUsed by how many were deleted
      for (const [userId, count] of Object.entries(userCounts)) {
        await User.findOneAndUpdate(
          { _id: userId, tokensUsed: { $gte: count } },
          { $inc: { tokensUsed: -count } }
        );
        // If tokensUsed would go below 0, just reset to 0
        await User.findOneAndUpdate(
          { _id: userId, tokensUsed: { $lt: 0 } },
          { $set: { tokensUsed: 0 } }
        );
      }

      res.status(200).json({ success: true, message: 'All token history deleted. ' + result.deletedCount + ' record(s) removed.', deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};

module.exports = { generateIBeaconToken, buildEmailHTML, createTokenRouter };