import React, { useState, useEffect, useCallback } from 'react';
import API from '../../utils/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    success: { bg: '#dcfce7', color: '#166534', label: '✓ Verified' },
    failed:  { bg: '#fef2f2', color: '#b91c1c', label: '✗ Failed'   },
    never:   { bg: '#f3f4f6', color: '#6b7280', label: '— Not tested' },
  };
  const s = map[status] || map.never;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
};
const IconMail = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: '1.1rem' }}>
    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
      {label}
    </label>
    {children}
    {hint && <p style={{ margin: '4px 0 0', fontSize: '0.73rem', color: '#9ca3af', lineHeight: 1.5 }}>{hint}</p>}
  </div>
);

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', borderRadius: 8,
  border: '1px solid #d1d5db', fontSize: '0.875rem',
  color: '#111827', background: '#fff', outline: 'none',
};

const Card = ({ title, icon, children, accentColor = '#1976d2' }) => (
  <div style={{
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 12, overflow: 'hidden',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: '1.5rem',
  }}>
    <div style={{
      padding: '0.9rem 1.4rem', borderBottom: '1px solid #f3f4f6',
      background: `linear-gradient(135deg,${accentColor}08,${accentColor}03)`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: accentColor }}>{title}</span>
    </div>
    <div style={{ padding: '1.4rem' }}>{children}</div>
  </div>
);

const Btn = ({ onClick, disabled, loading, color = '#1976d2', children, variant = 'solid' }) => {
  const solid   = { background: disabled ? '#9ca3af' : color, color: '#fff', border: 'none' };
  const outline = { background: '#fff', color: disabled ? '#9ca3af' : color, border: `1.5px solid ${disabled ? '#d1d5db' : color}` };
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'opacity 0.15s',
      ...(variant === 'solid' ? solid : outline),
    }}>
      {loading && (
        <span style={{
          width: 13, height: 13, borderRadius: '50%',
          border: '2px solid currentColor', borderTopColor: 'transparent',
          display: 'inline-block', animation: 'spin 0.7s linear infinite',
        }} />
      )}
      {children}
    </button>
  );
};

// ── Google logo SVG ───────────────────────────────────────────────────────────
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// ── Zoho logo SVG ─────────────────────────────────────────────────────────────
const ZohoLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="8" fill="#E42527"/>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
      fontFamily="Arial,sans-serif" fontWeight="800" fontSize="13" fill="#fff" letterSpacing="-0.5">
      ZOHO
    </text>
  </svg>
);

// ── Provider config map ───────────────────────────────────────────────────────
const PROVIDERS = {
  gmail: {
    label:       'Gmail',
    icon:        <GoogleLogo />,
    host:        'smtp.gmail.com',
    port:        '587',
    secure:      false,
    accentColor: '#000000',
    badgeColor:  '#EA4335',
  },
  zoho: {
    label:       'Zoho Mail',
    icon:        <ZohoLogo />,
    host:        'smtppro.zoho.com',
    port:        '465',
    secure:      true,
    accentColor: '#E42527',
    badgeColor:  '#E42527',
  },
};

// ── Setup steps ───────────────────────────────────────────────────────────────
const GMAIL_SETUP_STEPS = [
  'Go to myaccount.google.com → Security',
  'Enable 2-Step Verification if not already on',
  'Search for "App passwords" in the search bar',
  'Select app: Mail, device: Other → give it a name',
  'Copy the generated 16-character password',
  'Paste it in the "App Password" field on the left',
];

const ZOHO_SETUP_STEPS = [
  'Log in to mail.zoho.com → Settings → Mail Accounts',
  'Select your account and go to the "SMTP" tab',
  'Note the SMTP host: smtppro.zoho.com, Port: 465, Encryption: SSL',
  'Use your full Zoho email address as the username',
  'Use your Zoho account password (or an App-Specific Password if 2FA is enabled)',
  'If 2FA is on: go to Zoho Accounts → Security → App Passwords and generate one',
];

const EMPTY_FORM = {
  smtpUser:  '',
  smtpPass:  '',
  fromName:  'EI RFID Solutions',
  fromEmail: '',
};

// ── Main component ────────────────────────────────────────────────────────────
const UserEmailConfiguration = () => {
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [provider,    setProvider]    = useState('gmail');
  const [savedConfig, setSavedConfig] = useState(null);
  const [loadError,   setLoadError]   = useState('');
  const [saveMsg,     setSaveMsg]     = useState({ type: '', text: '' });
  const [testEmail,   setTestEmail]   = useState('');
  const [testMsg,     setTestMsg]     = useState({ type: '', text: '' });
  const [saving,      setSaving]      = useState(false);
  const [testing,     setTesting]     = useState(false);
  const [editing,     setEditing]     = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await API.get('/admin/email-config/user');
      const c   = res.data.config;
      setSavedConfig(c);
      if (c.provider) setProvider(c.provider);
      setEditing(!c.smtpUser);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Failed to load email configuration.');
      setEditing(true);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setSaveMsg({ type: '', text: '' });
  };

  const handleSave = async () => {
    const prov      = PROVIDERS[provider];
    const userLabel = provider === 'gmail' ? 'Gmail address' : 'Zoho email address';
    const passLabel = provider === 'gmail' ? 'App Password' : 'Zoho password';
    const emailVal  = form.smtpUser.trim();

    if (!emailVal) { setSaveMsg({ type: 'error', text: `${userLabel} is required.` }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setSaveMsg({ type: 'error', text: 'Enter a valid email address.' }); return;
    }
    if (provider === 'gmail' && !emailVal.toLowerCase().endsWith('@gmail.com')) {
      setSaveMsg({ type: 'error', text: 'Gmail sender must be a @gmail.com address.' }); return;
    }
    if (!form.smtpPass.trim()) { setSaveMsg({ type: 'error', text: `${passLabel} is required.` }); return; }
    if (form.smtpPass.trim().length < 10) {
      setSaveMsg({ type: 'error', text: `${passLabel} must be at least 10 characters.` }); return;
    }

    setSaving(true); setSaveMsg({ type: '', text: '' });
    try {
      const res = await API.post('/admin/email-config/user', {
        provider,
        smtpUser:   form.smtpUser.trim(),
        smtpPass:   form.smtpPass.trim(),
        smtpHost:   prov.host,
        smtpPort:   prov.port,
        smtpSecure: prov.secure,
        fromName:   form.fromName.trim() || 'EI RFID Solutions',
        fromEmail:  form.fromEmail.trim() || form.smtpUser.trim(),
        isEnabled:  true,
      });
      setSavedConfig(res.data.config);
      setSaveMsg({ type: 'success', text: '✓ Configuration saved successfully.' });
      setEditing(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeSender = () => {
    setForm(EMPTY_FORM);
    setSaveMsg({ type: '', text: '' });
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setForm(EMPTY_FORM);
    setSaveMsg({ type: '', text: '' });
    setEditing(false);
  };

  const handleTest = async () => {
    if (!testEmail.trim()) { setTestMsg({ type: 'error', text: 'Enter a recipient email first.' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
      setTestMsg({ type: 'error', text: 'Enter a valid email address.' }); return;
    }

    if (!savedConfig?.smtpUser || savedConfig.provider !== provider) {
      const provLabel = PROVIDERS[provider]?.label || provider;
      setTestMsg({ type: 'error', text: `${provLabel} is not configured yet. Save your ${provLabel} settings first before testing.` });
      return;
    }

    setTesting(true); setTestMsg({ type: '', text: '' });
    try {
      const res = await API.post('/admin/email-config/user/test', { recipientEmail: testEmail.trim() });
      setTestMsg({ type: 'success', text: res.data.message });
      loadConfig();
    } catch (err) {
      const raw = (err.response?.data?.message || '').toLowerCase();
      let friendly = 'Test failed. Check your email configuration and try again.';
      if (raw.includes('535') || raw.includes('badcredentials') || raw.includes('username and password') || raw.includes('invalid login') || raw.includes('eauth'))
        friendly = provider === 'gmail'
          ? 'Incorrect email or App Password. Make sure you\'re using an App Password, not your regular Gmail password.'
          : 'Incorrect Zoho email or password. If 2FA is enabled, use an App-Specific Password.';
      else if (raw.includes('534') || raw.includes('application-specific') || raw.includes('app password'))
        friendly = 'Gmail requires an App Password when 2-Step Verification is on. Generate one at myaccount.google.com/apppasswords.';
      else if (raw.includes('connection') || raw.includes('etimedout') || raw.includes('econnection') || raw.includes('network'))
        friendly = 'Could not reach the mail server. Check your internet connection and try again.';
      else if (raw.includes('certificate') || raw.includes('tls') || raw.includes('ssl'))
        friendly = 'Secure connection failed. The SMTP encryption settings may be incorrect.';
      else if (raw.includes('recipient') || raw.includes('550') || raw.includes('no such user'))
        friendly = 'The recipient email address was rejected. Please verify it and try again.';
      else if (raw.includes('quota') || raw.includes('rate') || raw.includes('too many'))
        friendly = 'Sending limit reached. Please wait a moment before trying again.';
      setTestMsg({ type: 'error', text: friendly });
    } finally {
      setTesting(false);
    }
  };

  const msgBox = (msg) => msg.text ? (
    <div style={{
      marginTop: 10, padding: '10px 14px', borderRadius: 8, fontSize: '0.83rem',
      background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
      border:     `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
      color:      msg.type === 'success' ? '#166534' : '#b91c1c',
    }}>{msg.text}</div>
  ) : null;

  const prov = PROVIDERS[provider];

  const providerHints = {
    gmail: {
      userLabel:       'Gmail Address',
      userPlaceholder: 'yourname@gmail.com',
      passLabel:       'App Password',
      passPlaceholder: '16-character App Password',
      bannerTitle:     'Gmail via App Password',
      bannerText:      'Use a 16-character App Password — not your normal Gmail password.',
      bannerLink:      { href: 'https://myaccount.google.com/apppasswords', label: 'Generate App Password →' },
      fromHint:        'Must match your Gmail address above.',
      fromPlaceholder: (user) => user || 'yourname@gmail.com',
    },
    zoho: {
      userLabel:       'Zoho Email Address',
      userPlaceholder: 'yourname@yourdomain.com',
      passLabel:       'Zoho Password',
      passPlaceholder: 'Your Zoho password or App-Specific Password',
      bannerTitle:     'Zoho Mail via SMTP',
      bannerText:      'Use your full Zoho email as the username. If 2FA is enabled, generate an App-Specific Password.',
      bannerLink:      { href: 'https://accounts.zoho.com/home#security/app-password', label: 'Generate App-Specific Password →' },
      fromHint:        'Must match your Zoho email address above.',
      fromPlaceholder: (user) => user || 'yourname@yourdomain.com',
    },
  };
  const ph = providerHints[provider];

  const setupSteps  = provider === 'gmail' ? GMAIL_SETUP_STEPS : ZOHO_SETUP_STEPS;
  const setupTitle  = provider === 'gmail' ? 'Gmail App Password Setup' : 'Zoho Mail SMTP Setup';
  const setupIcon   = provider === 'gmail' ? <GoogleLogo /> : <ZohoLogo />;
  const setupAccent = provider === 'gmail' ? '#EA4335' : '#E42527';
  const setupTip    = provider === 'gmail'
    ? 'The App Password is a 16-character code that looks like abcd efgh ijkl mnop. Enter it without spaces.'
    : 'SMTP Host: smtppro.zoho.com · Port: 465 · Encryption: SSL. Use your full Zoho email address as the username.';

  return (
    <div className="admin-page">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#fef9c3', color: '#a16207' }}><IconMail size={22} color="#1565c0" />
</div>
        <div>
          <h1 className="admin-page-title">Client Email Configuration</h1>
          <p className="admin-page-subtitle">
            Configure the user sender account. User-related emails are sent from this address.
          </p>
        </div>
      </div>

      {loadError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '12px 16px', marginBottom: '1.5rem', color: '#b91c1c', fontSize: '0.875rem',
        }}> {loadError}</div>
      )}

      {/* ── Status bar ───────────────────────────────────────────────────────── */}
      {savedConfig?.smtpUser && (
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          padding: '0.9rem 1.3rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', background: '#22c55e',
              display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#374151' }}>
              Email sending is active via {PROVIDERS[savedConfig.provider || 'gmail']?.label || savedConfig.provider}
            </span>
          </div>
          <span style={{ fontSize: '0.83rem', color: '#6b7280' }}>
            Sender: <strong>{savedConfig.fromName} &lt;{savedConfig.fromEmail || savedConfig.smtpUser}&gt;</strong>
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Last test:</span>
            <StatusBadge status={savedConfig.lastTestStatus} />
            {savedConfig.lastTestedAt && (
              <span style={{ fontSize: '0.73rem', color: '#9ca3af' }}>
                {new Date(savedConfig.lastTestedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Provider tabs ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: '1.25rem',
        borderBottom: '2px solid #e5e7eb', paddingBottom: 0,
      }}>
        {Object.entries(PROVIDERS).map(([key, p]) => {
          const active = provider === key;
          return (
            <button
              key={key}
              onClick={() => {
                setProvider(key);
                setForm(EMPTY_FORM);
                setSaveMsg({ type: '', text: '' });
                setTestMsg({ type: '', text: '' });
                setEditing(!savedConfig?.smtpUser || savedConfig.provider !== key);
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', borderRadius: '8px 8px 0 0',
                border: active ? `2px solid ${p.badgeColor}` : '2px solid transparent',
                borderBottom: active ? '2px solid #fff' : '2px solid transparent',
                marginBottom: -2,
                background: active ? '#fff' : 'transparent',
                fontWeight: active ? 700 : 500, fontSize: '0.85rem',
                color: active ? p.badgeColor : '#6b7280',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {p.icon}
              {p.label}
              {savedConfig?.smtpUser && savedConfig.provider === key && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
                  display: 'inline-block', flexShrink: 0,
                }} title="Active provider" />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── LEFT: Sender Settings ─────────────────────────────────────────── */}
        <div>
          <Card title={`${prov.label} Sender Settings`} icon={prov.icon} accentColor={prov.accentColor}>

            {!editing && savedConfig?.smtpUser && savedConfig.provider === provider ? (
              // ── Summary view ──────────────────────────────────────────────
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 10, marginBottom: '1.1rem',
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #bbf7d0',
                  }}>{prov.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#166534' }}>
                      {savedConfig.fromName}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#374151', wordBreak: 'break-all' }}>
                      {savedConfig.fromEmail || savedConfig.smtpUser}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                  This {prov.label} account is currently used to send all user emails.
                  Click below to switch to a different account.
                </p>
                <Btn onClick={handleChangeSender} color="#1976d2" variant="outline">
                  Change Sender Account
                </Btn>
              </>
            ) : (
              // ── Edit form ────────────────────────────────────────────────
              <>
                {/* Not configured notice when switching to unconfigured tab */}
                {!editing && savedConfig?.smtpUser && savedConfig.provider !== provider && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: '1rem',
                    background: '#fefce8', border: '1px solid #fde68a',
                    fontSize: '0.8rem', color: '#92400e', lineHeight: 1.6,
                  }}>
                     <strong>{prov.label}</strong> is not configured yet. Fill in the form below to set it up.
                  </div>
                )}

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10, marginBottom: '1.1rem',
                  background: `linear-gradient(135deg,${prov.badgeColor}08,${prov.badgeColor}04)`,
                  border: `1px solid ${prov.badgeColor}30`,
                }}>
                  {prov.icon}
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.84rem', color: prov.accentColor }}>{ph.bannerTitle}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.5 }}>
                      {ph.bannerText}{' '}
                      <a href={ph.bannerLink.href} target="_blank" rel="noreferrer" style={{ color: '#1976d2' }}>
                        {ph.bannerLink.label}
                      </a>
                    </p>
                  </div>
                </div>

                <Field label={ph.userLabel}>
                  <input name="smtpUser" value={form.smtpUser} onChange={handleChange}
                    placeholder={ph.userPlaceholder} style={inputStyle} autoComplete="off" />
                </Field>

                <Field label={ph.passLabel}>
                  <input
                    name="smtpPass" type="password" value={form.smtpPass}
                    onChange={handleChange} placeholder={ph.passPlaceholder}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                    autoComplete="new-password"
                  />
                  <p style={{
                    margin: '4px 0 0', fontSize: '0.73rem', lineHeight: 1.5,
                    color: form.smtpPass.length > 0 && form.smtpPass.length < 10 ? '#b91c1c' : '#9ca3af',
                  }}>
                    {form.smtpPass.length > 0 ? `${form.smtpPass.length} / min 10 characters` : 'Minimum 10 characters'}
                  </p>
                </Field>

                <Field label="Sender Display Name" hint='Appears as the "From" name in the email client.'>
                  <input name="fromName" value={form.fromName} onChange={handleChange}
                    placeholder="EI RFID Solutions" style={inputStyle} />
                </Field>

                <Field label="From Email Address" hint={ph.fromHint}>
                  <input name="fromEmail" value={form.fromEmail} onChange={handleChange}
                    placeholder={ph.fromPlaceholder(form.smtpUser)} style={inputStyle} />
                </Field>

                {/* SMTP info box (Zoho only) */}
                {provider === 'zoho' && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: '1rem',
                    background: '#fef9ec', border: '1px solid #fde68a',
                    fontSize: '0.78rem', color: '#78350f', lineHeight: 1.6,
                  }}>
                    <strong>SMTP Details (auto-configured):</strong><br />
                    Host: <code>smtppro.zoho.com</code> · Port: <code>465</code> · Encryption: <code>SSL</code>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn onClick={handleSave} loading={saving} color="#1f8114">
                    {saving ? 'Saving…' : '💾 Save Configuration'}
                  </Btn>
                  {savedConfig?.smtpUser && (
                    <Btn onClick={handleCancelEdit} color="#6b7280" variant="outline">
                      Cancel
                    </Btn>
                  )}
                </div>
                {msgBox(saveMsg)}
              </>
            )}
          </Card>
        </div>

        {/* ── RIGHT: Test + Setup Guide ────────────────────────────────────── */}
        <div>
          <Card title="Send Test Email"  accentColor="#0e7a5a">
            <p style={{ fontSize: '0.84rem', color: '#374151', margin: '0 0 14px', lineHeight: 1.7 }}>
              After saving, send a test email to verify your {prov.label} configuration is working.
            </p>

            {(!savedConfig?.smtpUser || savedConfig.provider !== provider) && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: '1rem',
                background: '#fefce8', border: '1px solid #fde68a',
                fontSize: '0.8rem', color: '#92400e', lineHeight: 1.6,
              }}>
                 <strong>{prov.label}</strong> is not configured. Save your settings first to enable testing.
              </div>
            )}

            <Field label="Send test to">
              <input
                value={testEmail} onChange={e => setTestEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTest()}
                placeholder="your@email.com" style={inputStyle}
              />
            </Field>
            <Btn
              onClick={handleTest} loading={testing} color="#0e7a5a"
              disabled={!savedConfig?.smtpUser || savedConfig.provider !== provider}
            >
              {testing ? 'Sending…' : '📨 Send Test Email'}
            </Btn>
            {msgBox(testMsg)}
            {savedConfig?.lastTestStatus === 'failed' && savedConfig?.lastTestError && savedConfig.provider === provider && (() => {
              const e = savedConfig.lastTestError.toLowerCase();
              let msg = 'Test failed. Reconfigure and try again.';
              if (e.includes('535') || e.includes('badcredentials') || e.includes('username and password') || e.includes('invalid login') || e.includes('eauth'))
                msg = provider === 'gmail'
                  ? 'Incorrect email or App Password. Use an App Password, not your regular Gmail password.'
                  : 'Incorrect Zoho email or password. If 2FA is enabled, use an App-Specific Password.';
              else if (e.includes('534') || e.includes('application-specific') || e.includes('app password'))
                msg = 'Gmail requires an App Password when 2-Step Verification is on.';
              else if (e.includes('connection') || e.includes('etimedout') || e.includes('econnection') || e.includes('network'))
                msg = 'Could not reach the mail server. Check your internet connection.';
              else if (e.includes('certificate') || e.includes('tls') || e.includes('ssl'))
                msg = 'Secure connection failed. Check the SMTP encryption settings.';
              else if (e.includes('recipient') || e.includes('550') || e.includes('no such user'))
                msg = 'Recipient address rejected by the server. Verify it and try again.';
              else if (e.includes('quota') || e.includes('rate') || e.includes('too many'))
                msg = 'Sending limit reached. Wait a moment before retrying.';
              return (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 8,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  fontSize: '0.78rem', color: '#b91c1c',
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span style={{ flexShrink: 0 }}></span>
                  <span>{msg}</span>
                </div>
              );
            })()}
          </Card>

          {/* ── Setup Guide ──────────────────────────────────────────────── */}
          <Card title={setupTitle} icon={setupIcon} accentColor={setupAccent}>
            {setupSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: `linear-gradient(135deg,${setupAccent}20,${setupAccent}08)`,
                  border: `1px solid ${setupAccent}30`,
                  color: setupAccent, fontSize: '0.72rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#374151', lineHeight: 1.55 }}>{step}</p>
              </div>
            ))}
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: '#fffbeb', border: `1px solid ${setupAccent}25`,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.6 }}>
                {setupTip}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserEmailConfiguration;