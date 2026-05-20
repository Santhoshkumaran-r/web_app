const express    = require('express');
const crypto     = require('crypto');
const nodemailer = require('nodemailer');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Token = require('../models/Token');

const router = express.Router();

// ── AES-256-CBC Keys (store these in .env in production) ─────────────────────
// Must match the C# values exactly:
//   Key = "12345678901234567890123456789012"  (32 bytes)
//   IV  = "1234567890123456"                  (16 bytes)
const AES_KEY = process.env.TOKEN_AES_KEY || '12345678901234567890123456789012';
const AES_IV  = process.env.TOKEN_AES_IV  || '1234567890123456';

// ── Step 1: Convert decimal string → uppercase hex ───────────────────────────
// Mirrors C#: DecimalToHexValue(String.Format("{0:X}", value))
const decimalToHex = (decStr) => {
  const num = parseInt(decStr, 10);
  return num.toString(16).toUpperCase();
};

// ── Step 2: Main token generator — exact port of C# btnGenerate_Click ─────────
const generateIBeaconToken = (facilityDecimal, accessDecimal) => {

  // ── Facility Code: dec → hex → even length → padLeft 4 ───────────────────
  let facilityHex = decimalToHex(String(facilityDecimal));
  if (facilityHex.length % 2 !== 0) facilityHex = '0' + facilityHex; // ensure even bytes
  facilityHex = facilityHex.padStart(4, '0');                         // PadLeft(4, '0')

  // ── Access Code: dec → hex → even length → padLeft 6 ─────────────────────
  let accessHex = decimalToHex(String(accessDecimal));
  if (accessHex.length % 2 !== 0) accessHex = '0' + accessHex;       // ensure even bytes
  accessHex = accessHex.padStart(6, '0');                             // PadLeft(6, '0')

  // ── UUID: E11979C10000 + facility(4) + 0000 + access(6) + 000000 ──────────
  // Example: facility=926(039E), access=1234(0004D2)
  //   → E11979C10000039E00000004D2000000
  const UUIDdata = 'E11979C10000' + facilityHex + '0000' + accessHex + '000000';

  // ── iBeacon JSON payload (exact structure from C#) ────────────────────────
  const payload = JSON.stringify({
    Length:    '1A',
    Type:      'FF',
    CompanyID: '004C',
    UUID:      UUIDdata,
    Major:     '0000',
    Minor:     '0000',
    TxPower:   'C5',
  });

  // NOTE: The C# JSON has duplicate keys (Type and Length appear twice).
  // JSON.stringify deduplicates them. The encryption result will differ slightly
  // from the C# version because of this, but the UUID and logic are identical.
  // If you need byte-for-byte match, use the raw string version below:
  const rawPayload = `{"Length":"1A","Type":"FF","CompanyID":"004C","Type":"02","Length":"15","UUID":"${UUIDdata}","Major":"0000","Minor":"0000","TxPower":"C5"}`;

  // ── AES-256-CBC Encryption ────────────────────────────────────────────────
  // Matches C#: aes.Mode = CBC, aes.Padding = PKCS7
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(AES_KEY, 'utf8'),  // 32-byte key
    Buffer.from(AES_IV,  'utf8')   // 16-byte IV
  );
  cipher.setAutoPadding(true); // PKCS7 — same as C# PaddingMode.PKCS7

  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(rawPayload, 'utf8')),
    cipher.final(),
  ]);

  // ── Return Base64 string (same as C# Convert.ToBase64String) ─────────────
  return {
    tokenId:    encrypted.toString('base64'),
    UUIDdata,
    facilityHex,
    accessHex,
    payload:    rawPayload,
  };
};

// ── Nodemailer transporter ────────────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Email HTML template ───────────────────────────────────────────────────────
const buildEmailHTML = ({ tokenId, employeeEmail, adminName, issuedAt }) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,-apple-system,BlinkMacSystemFont,Arial,sans-serif;">
  <div style="max-width:540px;margin:40px auto;padding:0 16px 40px;">

    <!-- Header bar -->
    <div style="background:linear-gradient(135deg,#1976d2,#1565c0);border-radius:12px 12px 0 0;padding:28px 36px;text-align:center;">
      <p style="font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin:0 0 8px;">EI RFID Solutions</p>
      <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0;letter-spacing:-0.02em;">Your Access Token</h1>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px;">

      <p style="font-size:16px;color:#374151;margin:0 0 28px;line-height:1.7;">
        Hello, your access token has been issued by <strong style="color:#1565c0;">${adminName}</strong>. Please find your secure token below.
      </p>

      <!-- Token box -->
      <div style="background:#e3f2fd;border:2px solid #90caf9;border-radius:10px;padding:24px;margin-bottom:28px;">
        <p style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1565c0;margin:0 0 14px;">Token ID</p>
        <div style="background:#ffffff;padding:16px;border-radius:8px;border:1px solid #bbdefb;">
          <p style="font-family:'Courier New',Courier,monospace;font-size:14px;font-weight:700;color:#0d47a1;word-break:break-all;margin:0;line-height:1.9;">
            ${tokenId}
          </p>
        </div>
        <p style="font-size:13px;color:#1565c0;margin:12px 0 0;font-style:italic;">
          Copy the entire token above and keep it in a safe place.
        </p>
      </div>

      <!-- Meta table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;font-weight:500;">Issued To</td>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827;text-align:right;">${employeeEmail}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-size:14px;color:#6b7280;font-weight:500;">Issued At</td>
          <td style="padding:12px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;">${issuedAt}</td>
        </tr>
      </table>

      <!-- Warning -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 18px;">
        <p style="font-size:14px;color:#92400e;margin:0;line-height:1.7;">
          <strong>⚠ Important:</strong> Keep this token strictly confidential. Do not share it with anyone. This token has been issued exclusively for <strong>${employeeEmail}</strong>.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:13px;color:#9ca3af;margin-top:20px;line-height:1.7;">
      EI RFID Solutions Private Limited &nbsp;·&nbsp; This is an automated message, please do not reply.
    </p>
  </div>
</body>
</html>
`;

// ── POST /api/token/send ──────────────────────────────────────────────────────
// Protected: admin only
router.post('/send', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { facilityCode, accessCode, employeeEmail } = req.body;

    // ── 1. Validate ───────────────────────────────────────────────────────────
    if (!facilityCode && facilityCode !== 0) {
      return res.status(400).json({ success: false, message: 'Facility code is required.' });
    }
    if (!accessCode && accessCode !== 0) {
      return res.status(400).json({ success: false, message: 'Access code is required.' });
    }
    if (!employeeEmail) {
      return res.status(400).json({ success: false, message: 'Employee email is required.' });
    }

    const fc = parseInt(facilityCode, 10);
    const ac = parseInt(accessCode,   10);

    if (isNaN(fc) || fc < 0 || fc > 4095) {
      return res.status(400).json({ success: false, message: 'Facility code must be 0 – 4095 (12-bit).' });
    }
    if (isNaN(ac) || ac < 0 || ac > 16777215) {
      return res.status(400).json({ success: false, message: 'Access code must be 0 – 16777215 (24-bit).' });
    }
    if (!/^\S+@\S+\.\S+$/.test(employeeEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid employee email address.' });
    }

    // ── 2. Get admin identity from JWT (set by protect middleware) ────────────
    const adminName  = req.user.name;
    const adminEmail = req.user.email;

    // ── 3. Generate iBeacon token using exact C# logic ────────────────────────
    const { tokenId, UUIDdata, facilityHex, accessHex, payload } = generateIBeaconToken(fc, ac);

    const issuedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // ── 4. Send email ─────────────────────────────────────────────────────────
    const transporter = createTransporter();
    await transporter.verify(); // check SMTP connection first

    await transporter.sendMail({
      from:    `"${adminName} via Platform" <${process.env.EMAIL_USER}>`,
      to:      employeeEmail,
      subject: `Your Access Token — EI RFID Solutions`,
      html:    buildEmailHTML({ tokenId, employeeEmail, adminName, issuedAt }),
    });

    // ── 5. Save to MongoDB for audit trail ────────────────────────────────────
    await Token.create({
      token:            tokenId,
      facilityCode:     fc,
      accessCode:       ac,
      employeeEmail,
      generatedBy:      req.user._id,
      generatedByEmail: adminEmail,
      status:           'sent',
    });

    // ── 6. Return token to frontend ───────────────────────────────────────────
    res.status(200).json({
      success:  true,
      message:  `Token successfully sent to ${employeeEmail}`,
      tokenId,
      UUIDdata,
      facilityHex,
      accessHex,
    });

  } catch (error) {
    console.error('Token send error:', error);

    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return res.status(500).json({
        success: false,
        message: 'Email authentication failed. Check EMAIL_USER and EMAIL_PASS in your .env file.',
      });
    }
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      return res.status(500).json({
        success: false,
        message: 'Could not connect to email server. Check your internet connection.',
      });
    }

    res.status(500).json({ success: false, message: 'Failed to send token. Please try again.' });
  }
});

// ── GET /api/token/history ────────────────────────────────────────────────────
router.get('/history', protect, restrictTo('admin'), async (req, res) => {
  try {
    const tokens = await Token.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('generatedBy', 'name email');
    res.status(200).json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/token/history/:id — delete a single token record ──────────────
router.delete('/history/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token record not found.' });
    }
    await Token.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Token record deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/token/history — delete ALL token records ─────────────────────
router.delete('/history', protect, restrictTo('admin'), async (req, res) => {
  try {
    const result = await Token.deleteMany({});
    res.status(200).json({
      success: true,
      message: `All token history deleted. ${result.deletedCount} record(s) removed.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
