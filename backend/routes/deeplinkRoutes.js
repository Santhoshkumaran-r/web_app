/**
 * deeplinkRoutes.js
 *
 * Handles three things:
 *
 *  1. GET /.well-known/assetlinks.json              → Android App Links verification
 *  2. GET /.well-known/apple-app-site-association   → iOS Universal Links verification
 *  3. GET /deeplink/addcard?token=<encoded>         → Smart redirect page
 *
 * Register in server.js:
 *   const deeplinkRoutes = require('./routes/deeplinkRoutes');
 *   app.use('/', deeplinkRoutes);   // use '/' not '/deeplink' so .well-known routes work
 */

const express = require('express');
const router  = express.Router();

// ── 1. Android App Links verification ─────────────────────────────────────
router.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.eirfid.eismax_mobile_app',
        sha256_cert_fingerprints: [
          'DC:42:44:7F:3F:67:3D:47:A4:0A:BC:56:17:D4:F7:64:17:5F:3D:95:ED:28:72:CD:1C:F9:7C:5D:EA:47:CC:6A'
        ]
      }
    }
  ]);
});

// ── 2. iOS Universal Links verification ───────────────────────────────────
router.get('/.well-known/apple-app-site-association', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: '462ZL74W8J.com.eirfid.mobaccess',
          paths: ['/deeplink/*']
        }
      ]
    }
  });
});

// ── 3. Deep link redirect page ─────────────────────────────────────────────
router.get('/deeplink/addcard', (req, res) => {
  const token = req.query.token || '';

  if (!token) {
    return res.status(400).send('<h2>Invalid link — no token provided.</h2>');
  }

  const encodedToken = encodeURIComponent(token);
  const ANDROID_STORE = process.env.ANDROID_STORE_URL || 'https://play.google.com/store/apps/details?id=com.eirfid.eismax_mobile_app';
  const IOS_STORE     = process.env.IOS_STORE_URL     || 'https://apps.apple.com/in/app/ins-mob-access/id6760645061';
  const appURI        = `eirfid://addcard?token=${encodedToken}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Opening EI RFID App\u2026</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      background: #f3f4f6; min-height: 100vh;
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      padding: 40px 32px; max-width: 420px; width: 100%; text-align: center;
    }
    .logo {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, #1976d2, #1565c0);
      border-radius: 16px; margin: 0 auto 24px;
      display: flex; align-items: center; justify-content: center; font-size: 32px;
    }
    h1 { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 8px; }
    .subtitle { font-size: 15px; color: #6b7280; margin-bottom: 32px; line-height: 1.6; }
    .spinner {
      width: 48px; height: 48px; border: 4px solid #e5e7eb;
      border-top-color: #1976d2; border-radius: 50%;
      animation: spin 0.9s linear infinite; margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .trying-text { font-size: 15px; color: #374151; margin-bottom: 8px; }
    .trying-sub  { font-size: 13px; color: #9ca3af; }
    #fallback { display: none; }
    .token-box {
      background: #e3f2fd; border: 2px solid #90caf9;
      border-radius: 10px; padding: 20px; margin: 20px 0; text-align: left;
    }
    .token-label {
      font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; color: #1565c0; margin-bottom: 10px;
    }
    .token-value {
      font-family: 'Courier New', monospace; font-size: 13px; font-weight: 700;
      color: #0d47a1; word-break: break-all; background: #fff;
      padding: 12px; border-radius: 6px; border: 1px solid #bbdefb;
      line-height: 1.8; user-select: all;
    }
    .copy-btn {
      background: #1976d2; color: #fff; border: none; border-radius: 8px;
      padding: 10px 20px; font-size: 14px; font-weight: 600;
      cursor: pointer; margin-top: 12px; width: 100%;
    }
    .store-links { margin-top: 28px; }
    .store-links p { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
    .store-btn {
      display: inline-block; background: #111827; color: #fff;
      text-decoration: none; padding: 10px 20px;
      border-radius: 8px; font-size: 14px; font-weight: 600; margin: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">📱</div>
    <h1>EI RFID</h1>
    <p class="subtitle">Opening your access token in the mobile app\u2026</p>
    <div id="trying">
      <div class="spinner"></div>
      <p class="trying-text">Launching EI RFID app\u2026</p>
      <p class="trying-sub">If the app doesn't open in a moment, it may not be installed.</p>
    </div>
    <div id="fallback">
      <p style="font-size:15px;color:#374151;margin-bottom:4px;">App not detected. Here is your token:</p>
      <div class="token-box">
        <div class="token-label">Token ID</div>
        <div class="token-value" id="tokenDisplay">${token.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <button class="copy-btn" onclick="copyToken()">📋 Copy Token</button>
      </div>
      <div class="store-links">
        <p>Install the EI RFID app to use your token:</p>
        <a class="store-btn" href="${ANDROID_STORE}">▶ Google Play</a>
        <a class="store-btn" href="${IOS_STORE}">🍎 App Store</a>
      </div>
    </div>
  </div>
  <script>
    const APP_URI = "${appURI}";
    function showFallback() {
      document.getElementById('trying').style.display   = 'none';
      document.getElementById('fallback').style.display = 'block';
    }
    function copyToken() {
      const text = document.getElementById('tokenDisplay').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = '\u2705 Copied!';
        setTimeout(() => { btn.textContent = '📋 Copy Token'; }, 2000);
      });
    }
    window.location.href = APP_URI;
    const fallbackTimer = setTimeout(showFallback, 2200);
    window.addEventListener('blur', () => clearTimeout(fallbackTimer));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimeout(fallbackTimer);
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;