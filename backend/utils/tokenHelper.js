/**
 * Shared token utilities used by admin, vendor, and user token routes.
 * Single source of truth — change logic here and it applies everywhere.
 */
const crypto     = require('crypto');
const nodemailer = require('nodemailer');

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

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const buildEmailHTML = ({ tokenId, employeeEmail, senderName, senderRole, issuedAt }) =>
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
  '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,-apple-system,BlinkMacSystemFont,Arial,sans-serif;">' +
  '<div style="max-width:540px;margin:40px auto;padding:0 16px 40px;">' +
  '<div style="background:linear-gradient(135deg,#1976d2,#1565c0);border-radius:12px 12px 0 0;padding:28px 36px;text-align:center;">' +
  '<p style="font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin:0 0 8px;">EI RFID Solutions</p>' +
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
  '<p style="text-align:center;font-size:13px;color:#9ca3af;margin-top:20px;">EI RFID Solutions Private Limited &nbsp;·&nbsp; Automated message, do not reply.</p>' +
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

  router.post('/send', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      const { facilityCode, accessCode, employeeEmail } = req.body;
      const validated = validateTokenRequest(facilityCode, accessCode, employeeEmail);
      if (validated.error)
        return res.status(400).json({ success: false, message: validated.error });

      const { fc, ac } = validated;
      const senderName = req.user.name;
      const senderRole = allowedRole.charAt(0).toUpperCase() + allowedRole.slice(1);
      const { tokenId, UUIDdata, facilityHex, accessHex } = generateIBeaconToken(fc, ac);
      const issuedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      const transporter = createTransporter();
      await transporter.verify();
      await transporter.sendMail({
        from:    '"' + senderName + ' via EI RFID" <' + process.env.EMAIL_USER + '>',
        to:      employeeEmail,
        subject: 'Your Access Token — EI RFID Solutions',
        html:    buildEmailHTML({ tokenId, employeeEmail, senderName, senderRole, issuedAt }),
      });

      const record = await TokenModel.create({
        token: tokenId, facilityCode: fc, accessCode: ac,
        employeeEmail, generatedBy: req.user._id,
        generatedByEmail: req.user.email, status: 'sent',
      });

      res.status(200).json({
        success: true,
        message: 'Token successfully sent to ' + employeeEmail,
        tokenId, UUIDdata, facilityHex, accessHex, _id: record._id,
      });
    } catch (error) {
      console.error('[' + allowedRole + ' token] send error:', error.message);
      if (error.code === 'EAUTH' || error.responseCode === 535)
        return res.status(500).json({ success: false, message: 'Email authentication failed. Check EMAIL_USER and EMAIL_PASS in .env.' });
      if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT')
        return res.status(500).json({ success: false, message: 'Could not connect to email server.' });
      res.status(500).json({ success: false, message: 'Failed to send token.' });
    }
  });

  router.get('/history', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      const tokens = await TokenModel.find().sort({ createdAt: -1 }).limit(50).populate('generatedBy', 'name email');
      res.status(200).json({ success: true, tokens });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.delete('/history/:id', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`[${allowedRole}] delete token id:`, id);

      // Validate it looks like a MongoDB ObjectId before querying
      if (!id || id.length !== 24) {
        return res.status(400).json({ success: false, message: 'Invalid token ID format.' });
      }

      const deleted = await TokenModel.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Token record not found.' });
      }
      res.status(200).json({ success: true, message: 'Token record deleted.' });
    } catch (error) {
      console.error(`[${allowedRole}] delete error:`, error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.delete('/history', protect, restrictTo(allowedRole), async (req, res) => {
    try {
      const result = await TokenModel.deleteMany({});
      res.status(200).json({ success: true, message: 'All token history deleted. ' + result.deletedCount + ' record(s) removed.', deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};

module.exports = { generateIBeaconToken, buildEmailHTML, createTokenRouter };
