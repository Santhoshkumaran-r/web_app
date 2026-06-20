import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';

// ── Icons ─────────────────────────────────────────────────────────────────────
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const EditIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const WarnIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const CopyIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IconUser = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
// ── Email Not Configured Banner ───────────────────────────────────────────────
const EmailWarningBanner = () => (
  <div style={{
    background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10,
    padding: '14px 18px', marginBottom: '1.5rem',
    display: 'flex', alignItems: 'flex-start', gap: 12,
  }}>
    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}></span>
    <div>
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.875rem', color: '#92400e' }}>
        Email Not Configured
      </p>
      <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f', lineHeight: 1.6 }}>
        You need to configure your email before creating users. Credentials are sent automatically via email when a user is created.{' '}
        <Link to="/vendor/email-configuration" style={{ color: '#0e7a5a', fontWeight: 600, textDecoration: 'underline' }}>
          Set up Email Configuration →
        </Link>
      </p>
    </div>
  </div>
);

// ── Pool Summary Bar ──────────────────────────────────────────────────────────
const PoolSummary = ({ pool }) => {
  if (!pool || pool.vendorLimit === null) return null;
  const { vendorLimit, vendorUsed, totalAllocated, available, usersCount } = pool;
  const usedPct      = vendorLimit > 0 ? Math.min(100, (vendorUsed     / vendorLimit) * 100) : 0;
  const allocatedPct = vendorLimit > 0 ? Math.min(100, (totalAllocated / vendorLimit) * 100) : 0;
  const isLow = available <= Math.max(1, Math.floor(vendorLimit * 0.2));
  const isOut = available === 0;
  const accent = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#1976d2';
  const bg     = isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#f0f7ff';
  const border = isOut ? '#fecaca' : isLow ? '#fde68a' : '#bfdbfe';
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 10, padding: '10px 16px',
      marginBottom: '1.25rem', display: 'flex',
      alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: accent, whiteSpace: 'nowrap' }}>🎟️ Token Pool</span>
      {[
        { label: 'Total',     value: vendorLimit,    color: '#1e40af' },
        { label: 'Used',      value: vendorUsed,     color: '#6d28d9' },
        { label: 'Allocated', value: totalAllocated, color: '#b45309' },
        { label: 'Available', value: available,      color: isOut ? '#b91c1c' : isLow ? '#d97706' : '#15803d' },
      ].map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: s.color }}>{s.value ?? '—'}</span>
          <span style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
        </div>
      ))}
      <div style={{ flex: 1, minWidth: 80 }}>
        <div style={{ height: 6, borderRadius: 6, background: '#e5e7eb', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', height: '100%', width: `${allocatedPct}%`, background: '#fbbf2488', borderRadius: 6 }} />
          <div style={{ position: 'absolute', height: '100%', width: `${usedPct}%`, background: accent, borderRadius: 6, transition: 'width 0.4s ease' }} />
        </div>
      </div>
      {/* <span style={{ fontSize: '0.72rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
        {vendorUsed}/{vendorLimit} used · {usersCount} user{usersCount !== 1 ? 's' : ''}
      </span> */}
      {isOut  && <span style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 600, whiteSpace: 'nowrap' }}>Pool exhausted</span>}
      {isLow && !isOut && <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600, whiteSpace: 'nowrap' }}> Only {available} left</span>}
    </div>
  );
};

// ── Token Usage Bar ───────────────────────────────────────────────────────────
const UserUsageBar = ({ used, limit }) => {
  if (limit === null || limit === undefined) {
    return <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '4px 0 0' }}>No limit set</p>;
  }
  const remaining = Math.max(0, limit - used);
  const pct       = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const color     = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#0e7a5a';
  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 3 }}>
        <span style={{ color: '#6b7280' }}>{used}/{limit} used</span>
        <span style={{ fontWeight: 600, color: remaining === 0 ? '#ef4444' : '#15803d' }}>
          {remaining === 0 ? 'Limit reached' : `${remaining} left`}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

// ── Edit Limit Modal ──────────────────────────────────────────────────────────
const EditLimitModal = ({ account, pool, onSave, onCancel }) => {
  const [val,    setVal]    = useState(account.tokenLimit != null ? String(account.tokenLimit) : '');
  const [err,    setErr]    = useState('');
  const [saving, setSaving] = useState(false);
  const maxAvailable = pool?.vendorLimit != null ? pool.available + (account.tokenLimit || 0) : null;
  const handleSave = async () => {
    const n = val === '' ? null : parseInt(val, 10);
    if (n !== null && (isNaN(n) || n < 1)) { setErr('Enter a valid positive number.'); return; }
    if (n !== null && maxAvailable !== null && n > maxAvailable) {
      setErr(`Max you can allocate is ${maxAvailable} tokens.`); return;
    }
    setSaving(true);
    try {
      const res = await API.patch(`/vendor/credentials/user-limit/${account._id}`, { tokenLimit: n });
      onSave(res.data.account);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to update limit.');
    } finally { setSaving(false); }
  };
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-icon-wrap" style={{ background: '#e8f5e9', color: '#0e7a5a' }}><EditIcon /></div>
        <h3 className="modal-title">Edit Token Allocation</h3>
        <p className="modal-desc">Set how many tokens <strong>{account.name}</strong> can generate.</p>
        {maxAvailable !== null && (
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12, background: '#f9fafb', padding: '8px 12px', borderRadius: 8, textAlign: 'center' }}>
            Max you can allocate: <strong style={{ color: '#0e7a5a' }}>{maxAvailable}</strong> tokens
          </p>
        )}
        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <label className="tg-label">Token Limit <span style={{ color: '#9ca3af', fontWeight: 400 }}>(leave empty = no limit)</span></label>
          <input type="number" min="1" value={val} onChange={(e) => { setVal(e.target.value); setErr(''); }}
            placeholder="e.g. 100" className={`tg-input ${err ? 'tg-input--error' : ''}`} style={{ marginTop: 4 }} autoFocus />
          {err && <p className="tg-error">{err}</p>}
        </div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="modal-btn" onClick={handleSave} disabled={saving}
            style={{ background: '#0e7a5a', color: '#fff', border: 'none' }}>
            {saving ? <><span className="tg-spinner" style={{ width: 13, height: 13 }} /> Saving...</> : 'Save Allocation'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
const ConfirmModal = ({ name, onConfirm, onCancel, loading }) => (
  <div className="modal-backdrop">
    <div className="modal-box">
      <div className="modal-icon-wrap modal-icon-wrap--red"><WarnIcon /></div>
      <h3 className="modal-title">Delete User?</h3>
      <p className="modal-desc">Permanently remove <strong>{name}</strong>? This cannot be undone.</p>
      <div className="modal-actions">
        <button className="modal-btn modal-btn--cancel" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className="modal-btn modal-btn--red" onClick={onConfirm} disabled={loading}>
          {loading ? <><span className="tg-spinner" style={{ width: 13, height: 13 }} /> Deleting...</> : 'Yes, delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const VendorUserManagement = () => {
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [tokenLimit, setTokenLimit] = useState('');
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [copied,     setCopied]     = useState(false);

  const [users,        setUsers]       = useState([]);
  const [listLoading,  setListLoading] = useState(true);
  const [pool,         setPool]        = useState(null);

  const [editUser,  setEditUser]  = useState(null);
  const [confirm,   setConfirm]   = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  // ── Email config check ────────────────────────────────────────────────────
  const [emailReady, setEmailReady] = useState(null); // null=loading, true/false

  useEffect(() => {
    API.get('/admin/email-config/vendor')
      .then(res => {
        const c = res.data.config;
        setEmailReady(!!(c.isEnabled && c.smtpUser && c.smtpPass));
      })
      .catch(() => setEmailReady(false));
  }, []);

  // ── Fetch users & pool ────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [usersRes, poolRes] = await Promise.all([
        API.get('/vendor/credentials/my-users'),
        API.get('/vendor/credentials/pool'),
      ]);
      setUsers(usersRes.data.users || []);
      setPool(poolRes.data);
    } catch {
      setUsers([]);
    } finally {
      setListLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleField = (setter) => (e) => {
    setter(e.target.value);
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
    setResult(null);
  };

  const validate = () => {
    const errs = {};
    if (!name.trim())  errs.name  = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (tokenLimit !== '') {
      const n = parseInt(tokenLimit, 10);
      if (isNaN(n) || n < 1) errs.tokenLimit = 'Token allocation must be a positive number.';
      else if (pool?.vendorLimit != null && n > pool.available) {
        errs.tokenLimit = `Only ${pool.available} tokens available in your pool.`;
      }
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailReady) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true); setResult(null);
    try {
      const res = await API.post('/vendor/credentials/create-user', {
        name: name.trim(), email: email.trim().toLowerCase(),
        tokenLimit: tokenLimit === '' ? null : parseInt(tokenLimit, 10),
      });
      setResult({ success: true, account: res.data.account });
      setName(''); setEmail(''); setTokenLimit('');
      fetchData();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed to create user.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (val) => {
    navigator.clipboard.writeText(val).then(() => { setCopied(val); setTimeout(() => setCopied(false), 2000); });
  };

  const handleLimitSaved = (updated) => {
    setUsers((prev) => prev.map((u) => u._id === updated._id ? { ...u, ...updated } : u));
    setEditUser(null);
    fetchData();
  };

  const openDelete   = (user) => setConfirm(user);
  const closeConfirm = () => { if (!deleting) setConfirm(null); };
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.delete(`/vendor/credentials/user/${confirm._id}`);
      setUsers((u) => u.filter((x) => x._id !== confirm._id));
      setConfirm(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">

      {confirm  && <ConfirmModal name={confirm.name} onConfirm={handleDelete} onCancel={closeConfirm} loading={deleting} />}
      {editUser && <EditLimitModal account={editUser} pool={pool} onSave={handleLimitSaved} onCancel={() => setEditUser(null)} />}

      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#e8f5e9', color: '#0e7a5a' }}><IconUser size={22} color="#1565c0" />
</div>
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">Create user accounts and distribute your token quota among them.</p>
        </div>
      </div>

      {/* Email warning banner */}
      {emailReady === false && <EmailWarningBanner />}

      {/* Pool summary */}
      <PoolSummary pool={pool} />

      <div className="tg-layout">

        {/* ── LEFT: Create user form ── */}
        <div className="tg-card">
          <h2 className="tg-card-title">Create User Account</h2>

          {/* Disable form if email not configured */}
          <div style={{ opacity: emailReady === false ? 0.45 : 1, pointerEvents: emailReady === false ? 'none' : 'auto' }}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="tg-field">
                <label className="tg-label">Full Name</label>
                <input name="name" type="text" value={name}
                  onChange={handleField(setName)} placeholder="e.g. John Smith"
                  className={`tg-input ${errors.name ? 'tg-input--error' : ''}`} autoComplete="off" />
                {errors.name && <p className="tg-error">{errors.name}</p>}
              </div>

              <div className="tg-field">
                <label className="tg-label">Email Address</label>
                <input name="email" type="email" value={email}
                  onChange={handleField(setEmail)} placeholder="user@company.com"
                  className={`tg-input ${errors.email ? 'tg-input--error' : ''}`} autoComplete="off" />
                {errors.email && <p className="tg-error">{errors.email}</p>}
              </div>

              <div className="tg-field">
                <label className="tg-label">
                  Token Allocation
                  <span className="tg-tag" style={{ marginLeft: 6 }}>Optional</span>
                </label>
                <input name="tokenLimit" type="number" min="1" value={tokenLimit}
                  onChange={handleField(setTokenLimit)} placeholder="Enter token limit for this user"
                  className={`tg-input ${errors.tokenLimit ? 'tg-input--error' : ''}`} />
                {errors.tokenLimit
                  ? <p className="tg-error">{errors.tokenLimit}</p>
                  : pool?.vendorLimit != null
                    ? <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0' }}>
                        <strong style={{ color: '#0e7a5a' }}>{pool.available}</strong> tokens available in your pool to allocate.
                      </p>
                    : <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 0' }}>Max tokens this user can generate.</p>}
              </div>

              <div className="tg-info" style={{ marginBottom: '1rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                A secure password will be auto-generated and emailed to the user.
              </div>

              <button type="submit" className="tg-btn" disabled={loading} style={{ background: '#0e7a5a' }}>
                {loading
                  ? <><span className="tg-spinner" /> Creating User...</>
                  : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Create &amp; Send Credentials</>}
              </button>
            </form>
          </div>

          {/* Success */}
          {result?.success && (
            <div className="tg-success-block" style={{ marginTop: '1rem' }}>
              <div className="tg-success-top">
                <span className="tg-success-check">✓</span>
                <div>
                  <p className="tg-success-title">User account created</p>
                  <p className="tg-success-sub">Credentials sent to <strong>{result.account?.email}</strong></p>
                </div>
              </div>
              <div className="tg-token-box">
                <div className="tg-token-label-row">
                  <span className="tg-token-label">Account Details</span>
                  <button className={`tg-copy-btn ${copied === result.account?.email ? 'tg-copy-btn--copied' : ''}`}
                    onClick={() => handleCopy(result.account?.email)}>
                    {copied === result.account?.email ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy Email</>}
                  </button>
                </div>
                <p className="tg-token-value" style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: '#6b7280' }}>Name: </span><strong>{result.account?.name}</strong>
                  &nbsp;·&nbsp;
                  <span style={{ color: '#6b7280' }}>Allocation: </span>
                  <strong>{result.account?.tokenLimit != null ? `${result.account.tokenLimit} tokens` : 'Unlimited'}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {result && !result.success && (
            <div className="tg-banner tg-banner--error" style={{ marginTop: '1rem' }}>
              <span className="tg-banner-icon">✕</span>
              <div>
                <p className="tg-banner-title">Failed to create user</p>
                <p className="tg-banner-sub">{result.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Users list ── */}
        <div className="tg-history">
          <div className="tg-history-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="tg-card-title" style={{ margin: 0 }}>Your Users</h2>
              <span className="tg-history-count">{users.length} users</span>
            </div>
          </div>

          {listLoading ? (
            <div className="tg-history-empty"><p>Loading users...</p></div>
          ) : users.length === 0 ? (
            <div className="tg-history-empty">
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>👤</div>
              <p>No users created yet.</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>Users you create will appear here.</p>
            </div>
          ) : (
            <div className="tg-history-list">
              {users.map((user) => (
                <div className="tg-history-item" key={user._id}>
                  <div className="tg-history-row">
                    <div className="tg-history-email-wrap">
                      <div className="tg-history-avatar"
                        style={{ background: '#fffbeb', color: '#b45309', border: '1.5px solid #fde68a' }}>
                        {(user.name || user.email)?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="tg-history-email">{user.name}</p>
                        <p className="tg-history-meta">{user.email}</p>
                        <UserUsageBar used={user.tokensUsed || 0} limit={user.tokenLimit} />
                      </div>
                    </div>
                    <div className="tg-history-right">
                      <span className="tg-history-badge"
                        style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>
                        User
                      </span>
                      <p className="tg-history-date">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Just now'}
                      </p>
                      <button className="tg-delete-row-btn" onClick={() => setEditUser(user)} title="Edit token allocation"
                        style={{ color: '#0e7a5a', borderColor: '#bbf7d0' }}>
                        <EditIcon />
                      </button>
                      <button className="tg-delete-row-btn" onClick={() => openDelete(user)} title="Delete user">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorUserManagement;