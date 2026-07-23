import React, { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';

const FACILITY_MAX = 4095;
const ACCESS_MAX   = 16777215;
const IconKey        = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6"/>
    <path d="M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
);
const CopyIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const WarnIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ mode, onConfirm, onCancel, loading }) => {
  const isAll = mode === 'all';
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className={`modal-icon-wrap ${isAll ? 'modal-icon-wrap--red' : 'modal-icon-wrap--orange'}`}>
          <WarnIcon />
        </div>
        <h3 className="modal-title">{isAll ? 'Delete All Token History?' : 'Delete This Record?'}</h3>
        <p className="modal-desc">
          {isAll
            ? 'This will permanently delete every token record from the database. This action cannot be undone.'
            : 'This will permanently delete this token record from the database. This action cannot be undone.'}
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`modal-btn ${isAll ? 'modal-btn--red' : 'modal-btn--orange'}`} onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="tg-spinner" style={{ width: 13, height: 13 }} /> Deleting...</> : isAll ? 'Yes, delete all' : 'Yes, delete it'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Quota Bar ─────────────────────────────────────────────────────────────────
const QuotaBar = ({ used, limit }) => {
  if (limit === null || limit === undefined) return null; // unlimited — hide entirely

  const remaining = Math.max(0, limit - used);
  const pct       = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isOut     = remaining === 0;
  const isLow     = !isOut && remaining <= Math.max(1, Math.floor(limit * 0.2)); // ≤20% left
  const barColor  = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#1976d2';
  const bgColor   = isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#e3f2fd';
  const borderColor = isOut ? '#fecaca' : isLow ? '#fde68a' : '#90caf9';
  const textColor = isOut ? '#b91c1c' : isLow ? '#92400e' : '#1565c0';

  return (
    <div style={{
      background: bgColor, border: `1px solid ${borderColor}`,
      borderRadius: 10, padding: '14px 16px', marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: textColor }}>
          {isOut ? 'Token Limit Reached' : isLow ? 'Token Limit Low' : 'Token Quota'}
        </span>
        {/* <span style={{ fontSize: '0.8rem', fontWeight: 700, color: textColor }}>
          {remaining} / {limit} remaining
        </span> */}
      </div>
      <div style={{ height: 6, borderRadius: 6, background: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 6,
          width: `${pct}%`,
          background: isOut ? '#ef4444' : `linear-gradient(90deg, ${barColor}88, ${barColor})`,
          transition: 'width 0.4s ease',
        }} />
      </div>
      {isOut && (
        <p style={{ fontSize: '0.75rem', color: textColor, margin: '8px 0 0', lineHeight: 1.5 }}>
          You have used all tokens. Please contact your <strong>vendor or admin</strong> to request an increase.
        </p>
      )}
      {isLow && !isOut && (
        <p style={{ fontSize: '0.75rem', color: textColor, margin: '8px 0 0' }}>
          Only <strong>{remaining}</strong> token{remaining !== 1 ? 's' : ''} left. Contact your admin if you need more.
        </p>
      )}
    </div>
  );
};

// ── Limit Reached Banner ──────────────────────────────────────────────────────
const LimitReachedBanner = ({ role }) => {
  const contactWho = role?.toLowerCase() === 'user' ? 'vendor or admin' : 'admin';
  return (
    <div style={{
      background: '#fef2f2', border: '1.5px solid #fecaca',
      borderRadius: 10, padding: '16px 18px', marginTop: '1rem',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#b91c1c' }}>
          Token Limit Reached
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#991b1b', lineHeight: 1.6 }}>
          You have used all your allocated tokens. Please contact your{' '}
          <strong>{contactWho}</strong> to request additional tokens.
        </p>
      </div>
    </div>
  );
};

// ── Pagination Controls ───────────────────────────────────────────────────────
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Build a compact page list: 1 ... p-1 p p+1 ... last
  const pages = [];
  const windowSize = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - windowSize && i <= currentPage + windowSize)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="tg-pagination">
      <button
        className="tg-page-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹ Prev
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="tg-page-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`tg-page-btn ${p === currentPage ? 'tg-page-btn--active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className="tg-page-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next ›
      </button>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const TokenPage = ({ apiBase, accentColor = '#e3f2fd', role = 'Admin' }) => {
  const [form,         setForm]         = useState({
    clientName:    '',
    facilityCode:  '',
    accessCode:    '',
    firstName:     '',
    lastName:      '',
    employeeEmail: '',
  });
  const [errors,       setErrors]       = useState({});
  const [successEmail, setSuccessEmail] = useState('');
  const [sentToken,    setSentToken]    = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(true);
  const [confirm,      setConfirm]      = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Pagination state ─────────────────────────────────────────────────────────
  const [currentPage,  setCurrentPage]  = useState(1);
  const TOKENS_PER_PAGE = 10;

  // Quota state — only relevant for vendor/user (not admin)
  const [quota, setQuota] = useState({ tokenLimit: null, tokensUsed: 0 });

  // ── Fetch quota ─────────────────────────────────────────────────────────────
  const fetchQuota = useCallback(async () => {
    if (role === 'Admin') return; // admin has no limit
    try {
      const res = await API.get(`${apiBase}/quota`);
      setQuota({
        tokenLimit:  res.data.tokenLimit,
        tokensUsed:  res.data.tokensUsed,
      });
    } catch {
      // quota endpoint missing or error — silently ignore
    }
  }, [apiBase, role]);

  // ── Fetch history ───────────────────────────────────────────────────────────
  useEffect(() => {
    API.get(`${apiBase}/history`)
      .then((res) => {
        const tokens = (res.data.tokens || []).map((t) => ({
          ...t,
          _id: t._id?.toString() || t._id,
        }));
        setHistory(tokens);
        setCurrentPage(1);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));

    fetchQuota();
  }, [apiBase, fetchQuota]);

  // ── Form handlers ───────────────────────────────────────────────────────────
  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    if (!/^\d*$/.test(value)) return;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setSuccessEmail(''); setSentToken(''); setErrorMsg(''); setLimitReached(false);
  };

  const handleTextInput = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setSuccessEmail(''); setSentToken(''); setErrorMsg(''); setLimitReached(false);
  };

  const handleEmailInput = (e) => {
    setForm((f) => ({ ...f, employeeEmail: e.target.value }));
    setErrors((er) => ({ ...er, employeeEmail: '' }));
    setSuccessEmail(''); setSentToken(''); setErrorMsg(''); setLimitReached(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.clientName) errs.clientName = 'Client name is required.';
    if (!form.facilityCode) errs.facilityCode = 'Facility code is required.';
    else if (parseInt(form.facilityCode, 10) > FACILITY_MAX) errs.facilityCode = `Max value is ${FACILITY_MAX.toLocaleString()} (12-bit).`;
    if (!form.accessCode) errs.accessCode = 'Access code is required.';
    else if (parseInt(form.accessCode, 10) > ACCESS_MAX) errs.accessCode = `Max value is ${ACCESS_MAX.toLocaleString()} (24-bit).`;
    if (!form.firstName) errs.firstName = 'First name is required.';
    if (!form.lastName) errs.lastName = 'Last name is required.';
    if (!form.employeeEmail) errs.employeeEmail = 'Employee email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.employeeEmail)) errs.employeeEmail = 'Enter a valid email address.';
    return errs;
  };

  const handleCopy = () => {
    if (!sentToken) return;
    navigator.clipboard.writeText(sentToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setSuccessEmail(''); setSentToken(''); setErrorMsg(''); setCopied(false); setLimitReached(false);

    try {
      const res = await API.post(`${apiBase}/send`, {
        clientName:    form.clientName,
        facilityCode:  parseInt(form.facilityCode, 10),
        accessCode:    parseInt(form.accessCode,   10),
        firstName:     form.firstName,
        lastName:      form.lastName,
        employeeEmail: form.employeeEmail,
      });

      setSuccessEmail(form.employeeEmail);
      setSentToken(res.data.tokenId);

      // Update quota locally
      if (res.data.tokenLimit !== undefined) {
        setQuota({ tokenLimit: res.data.tokenLimit, tokensUsed: res.data.tokensUsed });
      } else {
        setQuota((q) => ({ ...q, tokensUsed: q.tokensUsed + 1 }));
      }

      setHistory((h) => [{
        _id:           res.data._id || Date.now().toString(),
        clientName:    form.clientName,
        token:         res.data.tokenId,
        facilityCode:  parseInt(form.facilityCode, 10),
        accessCode:    parseInt(form.accessCode,   10),
        firstName:     form.firstName,
        lastName:      form.lastName,
        employeeEmail: form.employeeEmail,
        sentAt:        new Date().toISOString(),
        status:        'sent',
      }, ...h].slice(0, 50));

      // New token was added at the top — jump back to page 1 so the user sees it
      setCurrentPage(1);

      setForm({
        clientName:    '',
        facilityCode:  '',
        accessCode:    '',
        firstName:     '',
        lastName:      '',
        employeeEmail: '',
      });

    } catch (err) {
      if (err.response?.data?.limitReached) {
        setLimitReached(true);
        // Sync quota from server response
        setQuota({
          tokenLimit: err.response.data.tokenLimit,
          tokensUsed: err.response.data.tokensUsed,
        });
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to send token. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Delete handlers ─────────────────────────────────────────────────────────
  const openDeleteSingle = (id, index) => setConfirm({ mode: 'single', id, index });
  const openDeleteAll    = ()           => setConfirm({ mode: 'all' });
  const closeConfirm     = ()           => { if (!deleting) setConfirm(null); };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (confirm.mode === 'all') {
        await API.delete(`${apiBase}/history`);
        setHistory([]);
        setCurrentPage(1);
      } else {
        await API.delete(`${apiBase}/history/${confirm.id}`);
        setHistory((h) => {
          const updated = h.filter((_, i) => i !== confirm.index);
          const newTotalPages = Math.max(1, Math.ceil(updated.length / TOKENS_PER_PAGE));
          setCurrentPage((p) => Math.min(p, newTotalPages));
          return updated;
        });
      }
      setConfirm(null);
      // Re-fetch quota after deletion so the bar updates
      await fetchQuota();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const isLimitBlocked = quota.tokenLimit !== null &&
    quota.tokenLimit !== undefined &&
    quota.tokensUsed >= quota.tokenLimit;

  // ── Pagination derived values ────────────────────────────────────────────────
  const totalPages    = Math.max(1, Math.ceil(history.length / TOKENS_PER_PAGE));
  const startIndex    = (currentPage - 1) * TOKENS_PER_PAGE;
  const currentTokens = history.slice(startIndex, startIndex + TOKENS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="admin-page">

      {confirm && (
        <ConfirmModal mode={confirm.mode} onConfirm={handleConfirmDelete} onCancel={closeConfirm} loading={deleting} />
      )}

      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: accentColor, color: '#1565c0' }}><IconKey size={22} color="#1565c0" />
</div>
        <div>
          <h1 className="admin-page-title">Token Generation</h1>
          <p className="admin-page-subtitle">
            Generate a secure AES-256 encrypted token and send it to an employee's email.
          </p>
        </div>
      </div>

      <div className="tg-layout">

        {/* ── Form card ── */}
        <div className="tg-card">
          <h2 className="tg-card-title">Generate Token</h2>

          {/* Quota bar — only for vendor/user */}
          <QuotaBar used={quota.tokensUsed} limit={quota.tokenLimit} />

          <form onSubmit={handleSubmit} noValidate>

            <div className="tg-field">
              <label className="tg-label">Client Name</label>
              <input type="text" name="clientName" value={form.clientName}
                onChange={handleTextInput} placeholder="Enter client name"
                className={`tg-input ${errors.clientName ? 'tg-input--error' : ''}`} autoComplete="off"
                disabled={isLimitBlocked} />
              {errors.clientName && <p className="tg-error">{errors.clientName}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">Facility Code <span className="tg-tag">12-bit · max 4,095</span></label>
              <input type="text" inputMode="numeric" name="facilityCode" value={form.facilityCode}
                onChange={handleNumberInput} placeholder="Enter facility code (0 – 4095)" maxLength={4}
                className={`tg-input ${errors.facilityCode ? 'tg-input--error' : ''}`} autoComplete="off"
                disabled={isLimitBlocked} />
              {errors.facilityCode && <p className="tg-error">{errors.facilityCode}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">Access Code <span className="tg-tag">24-bit · max 16,777,215</span></label>
              <input type="text" inputMode="numeric" name="accessCode" value={form.accessCode}
                onChange={handleNumberInput} placeholder="Enter access code (0 – 16777215)" maxLength={8}
                className={`tg-input ${errors.accessCode ? 'tg-input--error' : ''}`} autoComplete="off"
                disabled={isLimitBlocked} />
              {errors.accessCode && <p className="tg-error">{errors.accessCode}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">First Name</label>
              <input type="text" name="firstName" value={form.firstName}
                onChange={handleTextInput} placeholder="Enter first name"
                className={`tg-input ${errors.firstName ? 'tg-input--error' : ''}`} autoComplete="off"
                disabled={isLimitBlocked} />
              {errors.firstName && <p className="tg-error">{errors.firstName}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">Last Name</label>
              <input type="text" name="lastName" value={form.lastName}
                onChange={handleTextInput} placeholder="Enter last name"
                className={`tg-input ${errors.lastName ? 'tg-input--error' : ''}`} autoComplete="off"
                disabled={isLimitBlocked} />
              {errors.lastName && <p className="tg-error">{errors.lastName}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">Employee Email</label>
              <input type="email" name="employeeEmail" value={form.employeeEmail}
                onChange={handleEmailInput} placeholder="employee@company.com"
                className={`tg-input ${errors.employeeEmail ? 'tg-input--error' : ''}`} autoComplete="off"
                disabled={isLimitBlocked} />
              {errors.employeeEmail && <p className="tg-error">{errors.employeeEmail}</p>}
            </div>

            <button type="submit" className="tg-btn" disabled={loading || isLimitBlocked}
              style={isLimitBlocked ? { background: '#9ca3af', cursor: 'not-allowed' } : {}}>
              {loading
                ? <><span className="tg-spinner" /> Sending Token...</>
                : isLimitBlocked
                  ? <>Token Limit Reached</>
                  : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Token</>}
            </button>
          </form>

          {/* Limit reached banner */}
          {(limitReached || isLimitBlocked) && <LimitReachedBanner role={role} />}

          {/* Success */}
          {successEmail && !limitReached && (
            <div className="tg-success-block" style={{ marginTop: '1rem' }}>
              <div className="tg-success-top">
                <span className="tg-success-check">✓</span>
                <div>
                  <p className="tg-success-title">Token sent successfully</p>
                  <p className="tg-success-sub">Delivered to <strong>{successEmail}</strong></p>
                </div>
              </div>
              <div className="tg-token-box">
                <div className="tg-token-label-row">
                  <span className="tg-token-label">Token ID</span>
                  <button className={`tg-copy-btn ${copied ? 'tg-copy-btn--copied' : ''}`} onClick={handleCopy}>
                    {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                  </button>
                </div>
                <p className="tg-token-value">{sentToken}</p>
              </div>
            </div>
          )}

          {/* Generic error */}
          {errorMsg && !limitReached && (
            <div className="tg-banner tg-banner--error" style={{ marginTop: '1rem' }}>
              <span className="tg-banner-icon">✕</span>
              <div>
                <p className="tg-banner-title">Failed to send token</p>
                <p className="tg-banner-sub">{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="tg-info">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Token is AES-256 encrypted and sent via secure SMTP. All tokens are saved in the <strong>{role}</strong> collection.
          </div>
        </div>

        {/* ── History panel ── */}
        <div className="tg-history">
          <div className="tg-history-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="tg-card-title" style={{ margin: 0 }}>Token History</h2>
              <span className="tg-history-count">{history.length} records</span>
            </div>
            {history.length > 0 && (
              <button className="tg-delete-all-btn" onClick={openDeleteAll} title="Delete all">
                <TrashIcon /> Delete All
              </button>
             )}
          </div>

          {histLoading ? (
            <div className="tg-history-empty"><p>Loading history...</p></div>
          ) : history.length === 0 ? (
            <div className="tg-history-empty">
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
              <p>No tokens sent yet.</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>Tokens you generate will appear here.</p>
            </div>
          ) : (
            <>
              <div className="tg-history-list">
                {currentTokens.map((t, i) => (
                  <div className="tg-history-item" key={t._id || (startIndex + i)}>
                    <div className="tg-history-row">
                      <div className="tg-history-email-wrap">
                        <div className="tg-history-avatar">{t.employeeEmail?.charAt(0).toUpperCase()}</div>
                        <div style={{ minWidth: 0 }}>
                          <p className="tg-history-email">{t.firstName} {t.lastName} — {t.employeeEmail}</p>
                          <p className="tg-history-meta">{t.clientName} &nbsp;·&nbsp; FC: {t.facilityCode} &nbsp;·&nbsp; AC: {t.accessCode}</p>
                        </div>
                      </div>
                      <div className="tg-history-right">
                        <span className="tg-history-badge">✓ sent</span>
                        <p className="tg-history-date">
                          {t.sentAt
                            ? new Date(t.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'Just now'}
                        </p>
                        <button className="tg-delete-row-btn" onClick={() => openDeleteSingle(t._id, startIndex + i)} title="Delete this record">
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default TokenPage;