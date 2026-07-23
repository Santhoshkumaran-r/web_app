/**
 * Shared token utilities used by admin, vendor, and user token routes.
 * Single source of truth — change logic here and it applies everywhere.
 */
const crypto       = require('crypto');
const User         = require('../models/User');
const { sendMail } = require('./mailerService');

const AES_KEY = process.env.TOKEN_AES_KEY || '12345678901234567890123456789012';
const AES_IV  = process.env.TOKEN_AES_IV  || '1234567890123456';

// ── Deep link base URL ───────────────────────────────────────────────────────
const DEEP_LINK_BASE = 'https://ei900.eirfid.com/open';

const buildDeepLink = (tokenId) =>
  `${DEEP_LINK_BASE}?token=${encodeURIComponent(tokenId)}`;
// ────────────────────────────────────────────────────────────────────────────

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


const buildEmailHTML = ({ tokenId, employeeEmail, senderName, senderRole, issuedAt, orgName }) => {
  const deepLink = buildDeepLink(tokenId);
  return (
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

    // ── Deep link button ───────────────────────────────────────────────────
    '<div style="text-align:center;margin-bottom:28px;">' +
    '<a href="' + deepLink + '" style="display:inline-block;background:#1976d2;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">Open in App</a>' +
    '<p style="font-size:12px;color:#9ca3af;margin:10px 0 0;">Tap to open the mobile app and auto-fill your token.</p>' +
    '<p style="font-size:11px;color:#c0c0c0;margin:6px 0 0;word-break:break-all;">' + deepLink + '</p>' +
    '</div>' +
    // ──────────────────────────────────────────────────────────────────────

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
    '</div></body></html>'
  );
};

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

// ── Bulk-import support ───────────────────────────────────────────────────────
// In-memory job store shared by every role's router (admin/vendor/user all
// require this same module, so the Map is a true singleton across all three).
// Works for a single PM2 process (fork mode) — move to Redis/Mongo if this
// backend ever runs in PM2 cluster mode.
const bulkJobs             = new Map();
const BULK_JOB_TTL_MS      = 60 * 60 * 1000; // jobs are garbage-collected after 1 hour
const MAX_BULK_ROWS        = 2000;
const EMAIL_SEND_DELAY_MS  = 350; // spacing between sends — keeps you under Gmail's per-second rate limits
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mirrors the quota checks in /send, as a reusable function for the bulk-import loop.
const checkQuota = async (sender, allowedRole) => {
  if (allowedRole === 'vendor' && sender.tokenLimit !== null) {
    const vendorUsers    = await User.find({ vendorId: sender._id, role: 'user' });
    const totalAllocated = vendorUsers.reduce((sum, u) => sum + (u.tokenLimit || 0), 0);
    const vendorOwn      = sender.tokenLimit - totalAllocated;
    if (sender.tokensUsed >= vendorOwn) {
      return `You have used all your available tokens (${vendorOwn} kept after allocating ${totalAllocated} to users). Contact admin to increase your limit.`;
    }
  }
  if (sender.tokenLimit !== null && sender.tokensUsed >= sender.tokenLimit) {
    return `You have reached your token limit of ${sender.tokenLimit}.`;
  }
  if (allowedRole === 'user' && sender.vendorId) {
    const vendor = await User.findById(sender.vendorId);
    if (vendor && vendor.tokenLimit !== null && vendor.tokensUsed >= vendor.tokenLimit) {
      return `Your vendor's token pool is exhausted.`;
    }
  }
  return null;
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
        const vendorOwn      = sender.tokenLimit - totalAllocated;
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

      const mailOwnerId = (allowedRole === 'admin') ? null : req.user._id;

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

  // ── POST /bulk-import ──────────────────────────────────────────────────────
  // Body: { rows: [{ facilityCode, accessCode, employeeEmail }, ...] }
  // Starts an async background job — never blocks the request, since 100-1000
  // rows sent one email at a time would otherwise time out the HTTP connection.
  // Responds immediately with a jobId; poll GET /bulk-import/:jobId/status.
  router.post('/bulk-import', protect, restrictTo(allowedRole), async (req, res) => {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows found to import.' });
    }
    if (rows.length > MAX_BULK_ROWS) {
      return res.status(400).json({ success: false, message: `Too many rows (${rows.length}). Max ${MAX_BULK_ROWS} per import.` });
    }

    const jobId = crypto.randomUUID();
    const job = { id: jobId, total: rows.length, processed: 0, results: [], completed: false, startedAt: Date.now() };
    bulkJobs.set(jobId, job);
    setTimeout(() => bulkJobs.delete(jobId), BULK_JOB_TTL_MS);

    // Respond right away — everything below runs in the background.
    res.status(202).json({ success: true, jobId, total: rows.length });

    const requesterId = req.user._id;
    const senderName   = req.user.name;
    const senderEmail  = req.user.email;
    const senderRole   = allowedRole.charAt(0).toUpperCase() + allowedRole.slice(1);
    const mailOwnerId  = (allowedRole === 'admin') ? null : requesterId;
    const { getConfig } = require('./mailerService');

    (async () => {
      let mailCfg;
      try {
        mailCfg = mailOwnerId
          ? (await getConfig(mailOwnerId).catch(() => null)) || (await getConfig(null))
          : await getConfig(null);
      } catch (e) {
        mailCfg = null;
      }
      const orgName = mailCfg?.fromName || 'EI RFID Solutions';

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i] || {};
        const rowNum = i + 2; // +2 accounts for the header row + 1-indexed spreadsheet rows
        const employeeEmail = raw.employeeEmail?.toString().trim();
        const facilityCode  = raw.facilityCode;
        const accessCode    = raw.accessCode;

        const validated = validateTokenRequest(facilityCode, accessCode, employeeEmail);
        if (validated.error) {
          job.results.push({ row: rowNum, employeeEmail: employeeEmail || '', status: 'failed', message: validated.error });
          job.processed++;
          continue;
        }
        const { fc, ac } = validated;

        // Re-check quota fresh on every row, since tokensUsed changes as we go.
        const sender = await User.findById(requesterId);
        const quotaError = await checkQuota(sender, allowedRole);
        if (quotaError) {
          // Stop the whole batch here — mark this row and every remaining row as failed.
          for (let j = i; j < rows.length; j++) {
            job.results.push({
              row: j + 2,
              employeeEmail: (rows[j].employeeEmail || '').toString().trim(),
              status: 'failed',
              message: quotaError,
            });
            job.processed++;
          }
          break;
        }

        try {
          const { tokenId, UUIDdata, facilityHex, accessHex } = generateIBeaconToken(fc, ac);
          const issuedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

          const mailResult = await sendMail({
            to:      employeeEmail,
            subject: 'Your Access Token — ' + orgName,
            html:    buildEmailHTML({ tokenId, employeeEmail, senderName, senderRole, issuedAt, orgName }),
            ownerId: mailOwnerId,
          });

          if (!mailResult.ok) {
            job.results.push({ row: rowNum, employeeEmail, status: 'failed', message: mailResult.error || 'Failed to send email.' });
          } else {
            await TokenModel.create({
              token: tokenId, facilityCode: fc, accessCode: ac,
              employeeEmail, generatedBy: requesterId,
              generatedByEmail: senderEmail, status: 'sent',
            });

            await User.findByIdAndUpdate(requesterId, { $inc: { tokensUsed: 1 } });
            if (allowedRole === 'user' && sender.vendorId) {
              await User.findByIdAndUpdate(sender.vendorId, { $inc: { tokensUsed: 1 } });
            }

            job.results.push({ row: rowNum, employeeEmail, status: 'success', tokenId, message: 'Token sent.' });
          }
        } catch (err) {
          job.results.push({ row: rowNum, employeeEmail, status: 'failed', message: 'Failed to generate/send token.' });
        }

        job.processed++;
        if (i < rows.length - 1) await sleep(EMAIL_SEND_DELAY_MS);
      }

      job.completed = true;
    })();
  });

  // ── GET /bulk-import/:jobId/status ────────────────────────────────────────
  router.get('/bulk-import/:jobId/status', protect, restrictTo(allowedRole), (req, res) => {
    const job = bulkJobs.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Import job not found or expired.' });
    }
    res.status(200).json({
      success:   true,
      total:     job.total,
      processed: job.processed,
      completed: job.completed,
      results:   job.results,
    });
  });

  // ── GET /quota ─────────────────────────────────────────────────────────────
  router.get('/quota', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('tokenLimit tokensUsed vendorId');

      let effectiveLimit = user.tokenLimit;

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

      if (deleted.generatedBy) {
        const generator = await User.findOneAndUpdate(
          { _id: deleted.generatedBy, tokensUsed: { $gt: 0 } },
          { $inc: { tokensUsed: -1 } },
          { new: true }
        );
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
      const allTokens = await TokenModel.find({}, 'generatedBy');

      const userCounts = {};
      for (const t of allTokens) {
        if (t.generatedBy) {
          const key = t.generatedBy.toString();
          userCounts[key] = (userCounts[key] || 0) + 1;
        }
      }

      const result = await TokenModel.deleteMany({});

      for (const [userId, count] of Object.entries(userCounts)) {
        await User.findOneAndUpdate(
          { _id: userId, tokensUsed: { $gte: count } },
          { $inc: { tokensUsed: -count } }
        );
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

module.exports = { generateIBeaconToken, buildEmailHTML, buildDeepLink, validateTokenRequest, createTokenRouter };