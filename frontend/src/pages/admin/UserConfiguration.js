import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';

// ── Icons ─────────────────────────────────────────────────────────────────────
const CopyIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const WarnIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const EditIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const MailIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconUser = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const VendorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);


// ── Config ────────────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  vendor: {
    label: 'Vendor', description: 'Business partner with portal access',
    color: '#0e7a5a', bg: '#f0fdf4', border: '#bbf7d0',
    activeBg: '#dcfce7', badgeBg: '#dcfce7', badgeText: '#166534',
    icon: <VendorIcon />,
  },
};

// ── Token Usage Bar ───────────────────────────────────────────────────────────
const TokenUsageBar = ({ used, limit, color }) => {
  if (limit === null || limit === undefined) {
    return (
      <div style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#9ca3af', marginBottom: 3 }}>
          <span>{used} used</span><span>Unlimited</span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #d1d5db, #e5e7eb)', borderRadius: 4 }} />
        </div>
      </div>
    );
  }
  const pct      = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const remaining = Math.max(0, limit - used);
  const barColor  = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : color;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 3 }}>
        <span style={{ color: '#6b7280' }}>{used}/{limit} used</span>
        <span style={{ fontWeight: 600, color: remaining === 0 ? '#ef4444' : remaining <= 3 ? '#f59e0b' : '#16a34a' }}>
          {remaining === 0 ? 'Limit reached' : `${remaining} left`}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, width: `${pct}%`,
          background: pct >= 100 ? '#ef4444' : `linear-gradient(90deg, ${barColor}99, ${barColor})`,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
};

// ── Edit Limit Modal ──────────────────────────────────────────────────────────
const EditLimitModal = ({ account, onSave, onCancel }) => {
  const [val, setVal]   = useState(account.tokenLimit !== null ? String(account.tokenLimit) : '');
  const [err, setErr]   = useState('');
  const [saving, setSaving] = useState(false);
  const cfg = ROLE_CONFIG[account.role] || ROLE_CONFIG.user;

  const handleSave = async () => {
    if (val !== '' && (isNaN(parseInt(val, 10)) || parseInt(val, 10) < 1)) {
      setErr('Enter a valid positive number, or leave empty for unlimited.');
      return;
    }
    setSaving(true);
    try {
      const res = await API.patch(`/admin/credentials/limit/${account._id}`, {
        tokenLimit: val === '' ? null : parseInt(val, 10),
      });
      onSave(res.data.account);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to update limit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-icon-wrap" style={{ background: cfg.bg, color: cfg.color }}>
          <EditIcon />
        </div>
        <h3 className="modal-title">Edit Token Limit</h3>
        <p className="modal-desc">
          Update the token generation limit for <strong>{account.name}</strong>
          &nbsp;({account.email}).
        </p>
        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <label className="tg-label">Token Limit <span style={{ color: '#9ca3af', fontWeight: 400 }}>(leave empty = unlimited)</span></label>
          <input
            type="number" min="1" value={val}
            onChange={(e) => { setVal(e.target.value); setErr(''); }}
            placeholder="e.g. 50"
            className={`tg-input ${err ? 'tg-input--error' : ''}`}
            style={{ marginTop: 4 }} autoFocus
          />
          {err && <p className="tg-error">{err}</p>}
          {account.tokensUsed > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>
              This account has already used <strong>{account.tokensUsed}</strong> tokens.
              {val !== '' && parseInt(val, 10) < account.tokensUsed
                ? <span style={{ color: '#ef4444' }}> New limit is below current usage.</span>
                : null}
            </p>
          )}
        </div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="modal-btn" onClick={handleSave} disabled={saving}
            style={{ background: cfg.color, color: '#fff', border: 'none' }}>
            {saving ? <><span className="tg-spinner" style={{ width: 13, height: 13 }} /> Saving...</> : 'Save Limit'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
const ConfirmModal = ({ onConfirm, onCancel, loading }) => (
  <div className="modal-backdrop">
    <div className="modal-box">
      <div className="modal-icon-wrap modal-icon-wrap--orange"><WarnIcon /></div>
      <h3 className="modal-title">Delete This Record?</h3>
      <p className="modal-desc">This will permanently remove this account record. This action cannot be undone.</p>
      <div className="modal-actions">
        <button className="modal-btn modal-btn--cancel" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className="modal-btn modal-btn--orange" onClick={onConfirm} disabled={loading}>
          {loading ? <><span className="tg-spinner" style={{ width: 13, height: 13 }} /> Deleting...</> : 'Yes, delete it'}
        </button>
      </div>
    </div>
  </div>
);

// ── Role Selector ─────────────────────────────────────────────────────────────
const RoleSelector = ({ value, onChange }) => (
  <div className="tg-field">
    <label className="tg-label">Account Type</label>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {Object.entries(ROLE_CONFIG).map(([roleKey, cfg]) => {
        const isActive = value === roleKey;
        return (
          <button key={roleKey} type="button" onClick={() => onChange(roleKey)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
            padding: '14px 16px', border: `2px solid ${isActive ? cfg.color : '#e5e7eb'}`,
            borderRadius: '10px', background: isActive ? cfg.activeBg : '#fff',
            cursor: 'pointer', transition: 'all 0.18s ease', textAlign: 'left',
            position: 'relative', boxShadow: isActive ? `0 0 0 3px ${cfg.color}20` : 'none',
          }}>
            <div style={{
              position: 'absolute', top: 10, right: 10, width: 10, height: 10,
              borderRadius: '50%', border: `2px solid ${isActive ? cfg.color : '#d1d5db'}`,
              background: isActive ? cfg.color : 'transparent', transition: 'all 0.18s ease',
            }} />
            <div style={{ color: isActive ? cfg.color : '#9ca3af', transition: 'color 0.18s ease' }}>
              {cfg.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: isActive ? cfg.color : '#374151', transition: 'color 0.18s ease' }}>
                {cfg.label}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: isActive ? cfg.color + 'cc' : '#9ca3af', lineHeight: 1.4, transition: 'color 0.18s ease' }}>
                {cfg.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

// ── Email Status Banner ───────────────────────────────────────────────────────
// Shown at top when email is not configured or disabled
const EmailStatusBanner = ({ emailConfig }) => {
  if (!emailConfig) return null; // still loading

  const notConfigured = !emailConfig.smtpUser;
  const notEnabled    = emailConfig.smtpUser && !emailConfig.isEnabled;

  if (!notConfigured && !notEnabled) return null; // all good — no banner needed

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      background: '#fffbeb', border: '1px solid #fde68a',
      borderRadius: 10, padding: '12px 16px', marginBottom: '1.25rem',
    }}>
      <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}></span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.84rem', color: '#92400e' }}>
          {notConfigured ? 'Email not configured' : 'Email sending is disabled'}
        </p>
        <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.6 }}>
          {notConfigured
            ? 'No sender email is set up yet. Accounts can still be created, but login credentials will NOT be emailed to the new user.'
            : 'Email sending is turned off. Accounts can still be created, but login credentials will NOT be emailed to the new user.'}
        </p>
        <Link
          to="/admin/email-configuration"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: '0.78rem', fontWeight: 600, color: '#92400e',
            background: '#fef3c7', border: '1px solid #fcd34d',
            borderRadius: 6, padding: '4px 10px', textDecoration: 'none',
          }}
        >
          <MailIcon /> {notConfigured ? 'Configure Email →' : 'Enable Email →'}
        </Link>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const UserConfiguration = () => {
  const [accountType,  setAccountType]  = useState('vendor');
  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [tokenLimit,   setTokenLimit]   = useState('');
  const [errors,       setErrors]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);   // { success, account, emailSent, message }
  const [copied,       setCopied]       = useState(false);

  const [accounts,     setAccounts]     = useState([]);
  const [listLoading,  setListLoading]  = useState(true);
  const [filterRole,   setFilterRole]   = useState('vendor');

  const [confirm,      setConfirm]      = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [editLimit,    setEditLimit]    = useState(null);

  // Email config status — loaded once on mount to show the warning banner
  const [emailConfig,  setEmailConfig]  = useState(undefined); // undefined = loading

  // ── Fetch email config ────────────────────────────────────────────────────
  useEffect(() => {
    API.get('/admin/email-config')
      .then(res => setEmailConfig(res.data.config))
      .catch(() => setEmailConfig(null));
  }, []);

  // ── Fetch accounts ────────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async (role = 'all') => {
    setListLoading(true);
    try {
      const param = role !== 'all' ? `?role=${role}` : '';
      const res   = await API.get(`/admin/credentials/list${param}`);
      setAccounts(res.data.accounts || []);
    } catch {
      setAccounts([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(filterRole); }, [filterRole, fetchAccounts]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleTypeChange = (roleKey) => { setAccountType(roleKey); setResult(null); setErrors({}); };

  const handleFieldChange = (field) => (e) => {
    if (field === 'name')       setName(e.target.value);
    if (field === 'email')      setEmail(e.target.value);
    if (field === 'tokenLimit') setTokenLimit(e.target.value);
    setErrors((p) => ({ ...p, [field]: '' }));
    setResult(null);
  };

  const validate = () => {
    const errs = {};
    if (!name.trim())  errs.name  = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (tokenLimit !== '' && tokenLimit !== null) {
      const n = parseInt(tokenLimit, 10);
      if (isNaN(n) || n < 1) errs.tokenLimit = 'Token limit must be a positive number.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await API.post('/admin/credentials/create', {
        name:        name.trim(),
        email:       email.trim().toLowerCase(),
        accountType,
        tokenLimit:  tokenLimit === '' ? null : parseInt(tokenLimit, 10),
      });
      setResult({
        success:   true,
        account:   res.data.account,
        emailSent: res.data.emailSent,   // ← capture this from backend
      });
      setName(''); setEmail(''); setTokenLimit('');
      fetchAccounts(filterRole);
      // Refresh email config banner in case it was just configured
      API.get('/admin/email-config').then(r => setEmailConfig(r.data.config)).catch(() => {});
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed to create account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (emailToCopy) => {
    navigator.clipboard.writeText(emailToCopy).then(() => {
      setCopied(emailToCopy);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Delete
  const openDelete   = (id, index) => setConfirm({ id, index });
  const closeConfirm = () => { if (!deleting) setConfirm(null); };
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.delete(`/admin/credentials/history/${confirm.id}`);
      setAccounts((a) => a.filter((_, i) => i !== confirm.index));
      setConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  // Edit limit saved
  const handleLimitSaved = (updatedAccount) => {
    setAccounts((prev) => prev.map((a) => a._id === updatedAccount._id ? { ...a, ...updatedAccount } : a));
    setEditLimit(null);
  };

  const cfg = ROLE_CONFIG[accountType];
  const filteredAccounts = accounts.filter(a => a.role === 'vendor');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">

      {confirm   && <ConfirmModal onConfirm={handleDelete} onCancel={closeConfirm} loading={deleting} />}
      {editLimit && <EditLimitModal account={editLimit} onSave={handleLimitSaved} onCancel={() => setEditLimit(null)} />}

      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}><IconUser size={22} color="#1565c0" />
</div>
        <div>
          <h1 className="admin-page-title">Vendor Management</h1>
          <p className="admin-page-subtitle">
            Create login credentials for Vendors and set their token generation limits.
          </p>
        </div>
      </div>

      {/* ── Email config warning banner ── */}
      <EmailStatusBanner emailConfig={emailConfig} />

      <div className="tg-layout">

        {/* ── LEFT: Form ── */}
        <div className="tg-card">
          <h2 className="tg-card-title">Create Account</h2>

          <form onSubmit={handleSubmit} noValidate>

            {/* Account type is fixed to Vendor */}
            <div className="tg-field">
              <label className="tg-label">Account Type</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', border: '2px solid #0e7a5a',
                borderRadius: 10, background: '#dcfce7',
              }}>
                <VendorIcon />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#0e7a5a' }}>Vendor</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#0e7a5acc' }}>Business partner with portal access</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="tg-field">
              <label className="tg-label">Name</label>
              <input type="text" value={name} onChange={handleFieldChange('name')}
                placeholder="e.g. John Smith"
                className={`tg-input ${errors.name ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.name && <p className="tg-error">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="tg-field">
              <label className="tg-label">Email Address</label>
              <input type="email" value={email} onChange={handleFieldChange('email')}
                placeholder={`${accountType}@company.com`}
                className={`tg-input ${errors.email ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.email && <p className="tg-error">{errors.email}</p>}
            </div>

            {/* Token Limit */}
            <div className="tg-field">
              <label className="tg-label">
                Token Limit
                <span className="tg-tag" style={{ marginLeft: 6 }}>Optional</span>
              </label>
              <input type="number" min="1" value={tokenLimit} onChange={handleFieldChange('tokenLimit')}
                placeholder="Enter a token limit"
                className={`tg-input ${errors.tokenLimit ? 'tg-input--error' : ''}`} />
              {errors.tokenLimit
                ? <p className="tg-error">{errors.tokenLimit}</p>
                : <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 0' }}>
                  </p>}
            </div>

            {/* Email status note inside form */}
            {emailConfig !== undefined && (
              <div className="tg-info" style={{
                marginBottom: '1rem',
                background: (!emailConfig?.smtpUser || !emailConfig?.isEnabled) ? '#fffbeb' : '#f0fdf4',
                borderColor: (!emailConfig?.smtpUser || !emailConfig?.isEnabled) ? '#fde68a' : '#bbf7d0',
              }}>
                <span style={{ fontSize: '0.85rem' }}>
                  {(!emailConfig?.smtpUser || !emailConfig?.isEnabled) ? '' : '📧'}
                </span>
                <span style={{ fontSize: '0.78rem', color: (!emailConfig?.smtpUser || !emailConfig?.isEnabled) ? '#92400e' : '#374151' }}>
                  {!emailConfig?.smtpUser
                    ? 'Email not configured — credentials will NOT be emailed. Account will still be created.'
                    : !emailConfig?.isEnabled
                    ? 'Email is disabled — credentials will NOT be emailed. Account will still be created.'
                    : `A secure password will be auto-generated and emailed to the new ${accountType}${tokenLimit ? ` with a limit of ${tokenLimit} tokens` : ''}.`}
                </span>
              </div>
            )}

            <button type="submit" className="tg-btn" disabled={loading} style={{ background: cfg.color }}>
              {loading
                ? <><span className="tg-spinner" /> Creating Account...</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Create &amp; Send Credentials</>}
            </button>
          </form>

          {/* ── Success block ── */}
          {result?.success && (
            <div className="tg-success-block" style={{ marginTop: '1rem' }}>
              <div className="tg-success-top">
                <span className="tg-success-check">✓</span>
                <div>
                  <p className="tg-success-title">Account created successfully</p>
                  <p className="tg-success-sub">
                    {result.emailSent
                      ? <>Credentials emailed to <strong>{result.account?.email}</strong></>
                      : <>Account created — <span style={{ color: '#f59e0b', fontWeight: 600 }}>email not sent</span> (email not configured)</>}
                  </p>
                </div>
              </div>

              {/* Email delivery status pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 600,
                marginBottom: 10,
                background: result.emailSent ? '#dcfce7' : '#fef3c7',
                color:      result.emailSent ? '#166534' : '#92400e',
                border:     `1px solid ${result.emailSent ? '#bbf7d0' : '#fde68a'}`,
              }}>
                {result.emailSent ? '✉️ Credentials email sent' : 'Email not sent — configure email first'}
              </div>

              {/* Account detail box */}
              <div className="tg-token-box">
                <div className="tg-token-label-row">
                  <span className="tg-token-label">Account Details</span>
                  <button
                    className={`tg-copy-btn ${copied === result.account?.email ? 'tg-copy-btn--copied' : ''}`}
                    onClick={() => handleCopy(result.account?.email)}>
                    {copied === result.account?.email ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy Email</>}
                  </button>
                </div>
                <p className="tg-token-value" style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: '#6b7280' }}>Name: </span><span style={{ fontWeight: 600 }}>{result.account?.name}</span>
                  &nbsp;·&nbsp;
                  <span style={{ color: '#6b7280' }}>Role: </span><span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{result.account?.role}</span>
                  &nbsp;·&nbsp;
                  <span style={{ color: '#6b7280' }}>Limit: </span>
                  <span style={{ fontWeight: 600 }}>
                    {result.account?.tokenLimit !== null && result.account?.tokenLimit !== undefined
                      ? `${result.account.tokenLimit} tokens`
                      : 'Unlimited'}
                  </span>
                </p>
              </div>

              {/* If email wasn't sent, show shortcut link */}
              {!result.emailSent && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 8,
                  background: '#fffbeb', border: '1px solid #fde68a',
                  fontSize: '0.78rem', color: '#92400e', lineHeight: 1.6,
                }}>
                  The account was created but the credentials could not be emailed because email is not set up.
                  {' '}<Link to="/admin/email-configuration" style={{ color: '#b45309', fontWeight: 600 }}>
                    Set up email now →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {result && !result.success && (
            <div className="tg-banner tg-banner--error" style={{ marginTop: '1rem' }}>
              <span className="tg-banner-icon">✕</span>
              <div>
                <p className="tg-banner-title">Failed to create account</p>
                <p className="tg-banner-sub">{result.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Accounts list ── */}
        <div className="tg-history">
          <div className="tg-history-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="tg-card-title" style={{ margin: 0 }}>Created Vendors</h2>
              <span className="tg-history-count">{filteredAccounts.length} records</span>
            </div>
            <span style={{
              fontSize: '0.73rem', fontWeight: 600, padding: '3px 10px',
              borderRadius: 20, background: '#dcfce7', color: '#166534',
              border: '1px solid #bbf7d0',
            }}>Vendors only</span>
          </div>

          {listLoading ? (
            <div className="tg-history-empty"><p>Loading accounts...</p></div>
          ) : filteredAccounts.length === 0 ? (
            <div className="tg-history-empty">
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>👥</div>
              <p>No vendors created yet.</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>Vendors you create will appear here.</p>
            </div>
          ) : (
            <div className="tg-history-list">
              {filteredAccounts.map((acc, i) => {
                const rs = ROLE_CONFIG[acc.role] || ROLE_CONFIG.user;
                return (
                  <div className="tg-history-item" key={acc._id || i}>
                    <div className="tg-history-row">

                      {/* Left: avatar + info */}
                      <div className="tg-history-email-wrap">
                        <div className="tg-history-avatar"
                          style={{ background: rs.bg, color: rs.color, border: `1.5px solid ${rs.border}` }}>
                          {(acc.name || acc.email)?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p className="tg-history-email">{acc.name || '—'}</p>
                          <p className="tg-history-meta">{acc.email}</p>
                          <TokenUsageBar used={acc.tokensUsed || 0} limit={acc.tokenLimit} color={rs.color} />
                        </div>
                      </div>

                      {/* Right: badge + date + actions */}
                      <div className="tg-history-right">
                        <span className="tg-history-badge"
                          style={{ background: rs.badgeBg, color: rs.badgeText, border: `1px solid ${rs.border}`, textTransform: 'capitalize' }}>
                          {acc.role}
                        </span>
                        <p className="tg-history-date">
                          {acc.createdAt
                            ? new Date(acc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'Just now'}
                        </p>
                        <button className="tg-delete-row-btn" onClick={() => setEditLimit(acc)} title="Edit token limit"
                          style={{ color: rs.color, borderColor: rs.border }}>
                          <EditIcon />
                        </button>
                        <button className="tg-delete-row-btn" onClick={() => openDelete(acc._id, i)} title="Delete account">
                          <TrashIcon />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserConfiguration;