import React, { useState, useEffect } from 'react';
import API from '../utils/api';

const FACILITY_MAX = 4095;
const ACCESS_MAX   = 16777215;

const CopyIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const CheckIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const TrashIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const WarnIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

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

/**
 * Reusable token generation page.
 * Props:
 *   apiBase   — e.g. '/admin/token' | '/vendor/token' | '/user/token'
 *   accentColor — hex color for the icon background
 *   role      — 'Admin' | 'Vendor' | 'User' (display only)
 */
const TokenPage = ({ apiBase, accentColor = '#e3f2fd', role = 'Admin' }) => {
  const [form, setForm]                 = useState({ facilityCode: '', accessCode: '', employeeEmail: '' });
  const [errors, setErrors]             = useState({});
  const [successEmail, setSuccessEmail] = useState('');
  const [sentToken, setSentToken]       = useState('');
  const [errorMsg, setErrorMsg]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [copied, setCopied]             = useState(false);
  const [history, setHistory]           = useState([]);
  const [histLoading, setHistLoading]   = useState(true);
  const [confirm, setConfirm]           = useState(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    API.get(`${apiBase}/history`)
      .then((res) => {
        // Convert _id to plain string to avoid ObjectId issues in URL params
        const tokens = (res.data.tokens || []).map((t) => ({
          ...t,
          _id: t._id?.toString() || t._id,
        }));
        setHistory(tokens);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [apiBase]);

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    if (!/^\d*$/.test(value)) return;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setSuccessEmail(''); setSentToken(''); setErrorMsg('');
  };

  const handleEmailInput = (e) => {
    setForm((f) => ({ ...f, employeeEmail: e.target.value }));
    setErrors((er) => ({ ...er, employeeEmail: '' }));
    setSuccessEmail(''); setSentToken(''); setErrorMsg('');
  };

  const validate = () => {
    const errs = {};
    if (!form.facilityCode) errs.facilityCode = 'Facility code is required.';
    else if (parseInt(form.facilityCode, 10) > FACILITY_MAX) errs.facilityCode = `Max value is ${FACILITY_MAX.toLocaleString()} (12-bit).`;
    if (!form.accessCode) errs.accessCode = 'Access code is required.';
    else if (parseInt(form.accessCode, 10) > ACCESS_MAX) errs.accessCode = `Max value is ${ACCESS_MAX.toLocaleString()} (24-bit).`;
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
    setSuccessEmail(''); setSentToken(''); setErrorMsg(''); setCopied(false);

    try {
      const res = await API.post(`${apiBase}/send`, {
        facilityCode:  parseInt(form.facilityCode, 10),
        accessCode:    parseInt(form.accessCode,   10),
        employeeEmail: form.employeeEmail,
      });

      setSuccessEmail(form.employeeEmail);
      setSentToken(res.data.tokenId);

      setHistory((h) => [{
        _id:           res.data._id || Date.now().toString(),
        token:         res.data.tokenId,
        facilityCode:  parseInt(form.facilityCode, 10),
        accessCode:    parseInt(form.accessCode,   10),
        employeeEmail: form.employeeEmail,
        sentAt:        new Date().toISOString(),
        status:        'sent',
      }, ...h].slice(0, 50));

      setForm({ facilityCode: '', accessCode: '', employeeEmail: '' });

    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteSingle = (id, index) => setConfirm({ mode: 'single', id, index });
  const openDeleteAll    = ()           => setConfirm({ mode: 'all' });
  const closeConfirm     = ()           => { if (!deleting) setConfirm(null); };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (confirm.mode === 'all') {
        await API.delete(`${apiBase}/history`);
        setHistory([]);
      } else {
        await API.delete(`${apiBase}/history/${confirm.id}`);
        setHistory((h) => h.filter((_, i) => i !== confirm.index));
      }
      setConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page">

      {confirm && (
        <ConfirmModal mode={confirm.mode} onConfirm={handleConfirmDelete} onCancel={closeConfirm} loading={deleting} />
      )}

      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: accentColor, color: '#1565c0' }}>🔑</div>
        <div>
          <h1 className="admin-page-title">Token Generation</h1>
          <p className="admin-page-subtitle">
            Generate a secure AES-256 encrypted token and send it to an employee's email.
          </p>
        </div>
      </div>

      <div className="tg-layout">

        {/* Form card */}
        <div className="tg-card">
          <h2 className="tg-card-title">Generate Token</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="tg-field">
              <label className="tg-label">Facility Code <span className="tg-tag">12-bit · max 4,095</span></label>
              <input type="text" inputMode="numeric" name="facilityCode" value={form.facilityCode}
                onChange={handleNumberInput} placeholder="Enter facility code (0 – 4095)" maxLength={4}
                className={`tg-input ${errors.facilityCode ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.facilityCode && <p className="tg-error">{errors.facilityCode}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">Access Code <span className="tg-tag">24-bit · max 16,777,215</span></label>
              <input type="text" inputMode="numeric" name="accessCode" value={form.accessCode}
                onChange={handleNumberInput} placeholder="Enter access code (0 – 16777215)" maxLength={8}
                className={`tg-input ${errors.accessCode ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.accessCode && <p className="tg-error">{errors.accessCode}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">Employee Email</label>
              <input type="email" name="employeeEmail" value={form.employeeEmail}
                onChange={handleEmailInput} placeholder="employee@company.com"
                className={`tg-input ${errors.employeeEmail ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.employeeEmail && <p className="tg-error">{errors.employeeEmail}</p>}
            </div>

            <button type="submit" className="tg-btn" disabled={loading}>
              {loading
                ? <><span className="tg-spinner" /> Sending Token...</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Token</>}
            </button>
          </form>

          {/* Success — shown below button */}
          {successEmail && (
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
                  <button className={`tg-copy-btn ${copied ? 'tg-copy-btn--copied' : ''}`} onClick={handleCopy} title="Copy token">
                    {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                  </button>
                </div>
                <p className="tg-token-value">{sentToken}</p>
              </div>
            </div>
          )}

          {/* Error — shown below button */}
          {errorMsg && (
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

        {/* History panel */}
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
            <div className="tg-history-list">
              {history.map((t, i) => (
                <div className="tg-history-item" key={t._id || i}>
                  <div className="tg-history-row">
                    <div className="tg-history-email-wrap">
                      <div className="tg-history-avatar">{t.employeeEmail?.charAt(0).toUpperCase()}</div>
                      <div style={{ minWidth: 0 }}>
                        <p className="tg-history-email">{t.employeeEmail}</p>
                        <p className="tg-history-meta">FC: {t.facilityCode} &nbsp;·&nbsp; AC: {t.accessCode}</p>
                      </div>
                    </div>
                    <div className="tg-history-right">
                      <span className="tg-history-badge">✓ sent</span>
                      <p className="tg-history-date">
                        {t.sentAt
                          ? new Date(t.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Just now'}
                      </p>
                      <button className="tg-delete-row-btn" onClick={() => openDeleteSingle(t._id, i)} title="Delete this record">
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

export default TokenPage;
