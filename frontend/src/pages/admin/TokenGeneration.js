import React, { useState, useEffect, useRef } from 'react';
import API from '../../utils/api';
import ExcelImportPanel from '../../components/ExcelImportPanel';

const FACILITY_MAX = 4095;
const ACCESS_MAX   = 16777215;
const PAGE_SIZE     = 7; // used for both the date-filtered view and the default month view

const IconKey        = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6"/>
    <path d="M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
);

// ── SVG Icons ────────────────────────────────────────────────────────────────
const CopyIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const CheckIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const TrashIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const WarnIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const CalendarIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

// ── Confirmation Modal ────────────────────────────────────────────────────────
const ConfirmModal = ({ mode, onConfirm, onCancel, loading }) => {
  const isAll = mode === 'all';
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className={`modal-icon-wrap ${isAll ? 'modal-icon-wrap--red' : 'modal-icon-wrap--orange'}`}>
          <WarnIcon />
        </div>
        <h3 className="modal-title">
          {isAll ? 'Delete All Token History?' : 'Delete This Record?'}
        </h3>
        <p className="modal-desc">
          {isAll
            ? 'This will permanently delete every token record from the database. This action cannot be undone.'
            : 'This will permanently delete this token record from the database. This action cannot be undone.'}
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`modal-btn ${isAll ? 'modal-btn--red' : 'modal-btn--orange'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? <><span className="tg-spinner" style={{ width: 13, height: 13 }} /> Deleting...</>
              : isAll ? 'Yes, delete all' : 'Yes, delete it'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Pagination controls ─────────────────────────────────────────────────────
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

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

// ── Single history row (shared by both views) ──────────────────────────────
const HistoryRow = ({ token, onDelete }) => (
  <div className="tg-history-item">
    <div className="tg-history-row">

      {/* Left: avatar + info */}
      <div className="tg-history-email-wrap">
        <div className="tg-history-avatar">
          {token.employeeEmail?.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="tg-history-email">
            {token.firstName} {token.lastName} — {token.employeeEmail}
          </p>
          <p className="tg-history-meta">
            {token.clientName} &nbsp;·&nbsp; FC: {token.facilityCode} &nbsp;·&nbsp; AC: {token.accessCode}
          </p>
        </div>
      </div>

      {/* Right: date + badge + delete */}
      <div className="tg-history-right">
        <span className="tg-history-badge">✓ sent</span>
        <p className="tg-history-date">
          {token.sentAt
            ? new Date(token.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Just now'}
        </p>
        <button
          className="tg-delete-row-btn"
          onClick={onDelete}
          title="Delete this record"
        >
          <TrashIcon />
        </button>
      </div>

    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const TokenGeneration = () => {
  const [form, setForm] = useState({
    clientName:    '',
    facilityCode:  '',
    accessCode:    '',
    firstName:     '',
    lastName:      '',
    employeeEmail: '',
  });
  const [errors, setErrors]             = useState({});
  const [successEmail, setSuccessEmail] = useState('');
  const [sentToken, setSentToken]       = useState('');
  const [errorMsg, setErrorMsg]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [copied, setCopied]             = useState(false);
  const [history, setHistory]           = useState([]);
  const [histLoading, setHistLoading]   = useState(true);

  // Modal state: null | { mode: 'all' } | { mode: 'single', id, index }
  const [confirm, setConfirm]   = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Date filter for the calendar picker — empty string means "show all, paginated"
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1); // single page counter, shared by both views
  const dateInputRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    API.get('/admin/token/history')
      .then((res) => {
        const tokens = (res.data.tokens || []).map((t) => ({
          ...t,
          _id: t._id?.toString() || t._id,
        }));
        setHistory(tokens);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, []);

  // ── Form handlers ───────────────────────────────────────────────────────────
  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    if (!/^\d*$/.test(value)) return;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setSuccessEmail(''); setSentToken(''); setErrorMsg('');
  };

  const handleTextInput = (e) => {
    const { name, value } = e.target;
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
    if (!form.clientName)
      errs.clientName = 'Client name is required.';
    if (!form.facilityCode)
      errs.facilityCode = 'Facility code is required.';
    else if (parseInt(form.facilityCode, 10) > FACILITY_MAX)
      errs.facilityCode = `Max value is ${FACILITY_MAX.toLocaleString()} (12-bit).`;
    if (!form.accessCode)
      errs.accessCode = 'Access code is required.';
    else if (parseInt(form.accessCode, 10) > ACCESS_MAX)
      errs.accessCode = `Max value is ${ACCESS_MAX.toLocaleString()} (24-bit).`;
    if (!form.firstName)
      errs.firstName = 'First name is required.';
    if (!form.lastName)
      errs.lastName = 'Last name is required.';
    if (!form.employeeEmail)
      errs.employeeEmail = 'Employee email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.employeeEmail))
      errs.employeeEmail = 'Enter a valid email address.';
    return errs;
  };

  // ── Copy token ──────────────────────────────────────────────────────────────
  const handleCopy = () => {
    if (!sentToken) return;
    navigator.clipboard.writeText(sentToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Send token ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setSuccessEmail(''); setSentToken(''); setErrorMsg(''); setCopied(false);

    try {
      const res = await API.post('/admin/token/send', {
        clientName:    form.clientName,
        facilityCode:  parseInt(form.facilityCode, 10),
        accessCode:    parseInt(form.accessCode,   10),
        firstName:     form.firstName,
        lastName:      form.lastName,
        employeeEmail: form.employeeEmail,
      });

      setSuccessEmail(form.employeeEmail);
      setSentToken(res.data.tokenId);

      // Add to top of history with _id from server
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

      // New token lands at the top — jump back to page 1 so the user sees it
      setPage(1);

      setForm({
        clientName:    '',
        facilityCode:  '',
        accessCode:    '',
        firstName:     '',
        lastName:      '',
        employeeEmail: '',
      });

    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send token. Please try again.');
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
        await API.delete('/admin/token/history');
        setHistory([]);
        setPage(1);
      } else {
        await API.delete(`admin/token/history/${confirm.id}`);
        setHistory((h) => h.filter((_, i) => i !== confirm.index));
      }
      setConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Date filter helpers ─────────────────────────────────────────────────────
  const isSameDay = (isoString, dateStr) => {
    if (!isoString || !dateStr) return false;
    const d = new Date(isoString);
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return local === dateStr;
  };

  // ── Active source list: either the date-filtered tokens, or all history ────
  const sourceTokens = selectedDate
    ? history.filter((t) => isSameDay(t.sentAt, selectedDate))
    : history;

  // ── Shared pagination over whichever source list is active ────────────────
  const totalPages  = Math.max(1, Math.ceil(sourceTokens.length / PAGE_SIZE));
  const startIndex  = (page - 1) * PAGE_SIZE;
  const pagedTokens = sourceTokens.slice(startIndex, startIndex + PAGE_SIZE);

  // Group only the current page's tokens by month (so the label still shows,
  // even though pagination now spans across months).
  const groupByMonth = (tokens) => {
    const groups = {};
    tokens.forEach((t) => {
      const d = t.sentAt ? new Date(t.sentAt) : new Date();
      const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  };

  const groupedPageTokens = groupByMonth(pagedTokens);

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setPage(1); // reset to page 1 whenever the date changes
  };

  const clearDate = () => {
    setSelectedDate('');
    setPage(1);
  };

  // Opens the native calendar popup; typing is blocked via onKeyDown instead
  // of readOnly, since readOnly makes Chrome reject showPicker().
  const openDatePicker = () => {
    if (dateInputRef.current?.showPicker) {
      dateInputRef.current.showPicker();
    } else {
      dateInputRef.current?.focus();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">

      {/* Confirmation modal */}
      {confirm && (
        <ConfirmModal
          mode={confirm.mode}
          onConfirm={handleConfirmDelete}
          onCancel={closeConfirm}
          loading={deleting}
        />
      )}

      {/* Page header */}
      <div className="admin-page-header">
<div className="admin-page-header-icon" style={{ background: '#e3f2fd', color: '#1565c0' }}>
  <IconKey size={22} color="#1565c0" />
</div>        <div>
          <h1 className="admin-page-title">Token Generation</h1>
          <p className="admin-page-subtitle">
            Generate a secure AES-256 encrypted token and send it to an employee's email.
          </p>
        </div>
      </div>

      <div className="tg-layout">

        {/* ── Left: Form card ── */}
        <div className="tg-card">
          <h2 className="tg-card-title">Generate Token</h2>

          {/* Bulk Excel import — generates + emails tokens for many users at once */}
          <ExcelImportPanel
            importEndpoint="/admin/token"
            onComplete={() => {
              API.get('/admin/token/history')
                .then((res) => {
                  const tokens = (res.data.tokens || []).map((t) => ({ ...t, _id: t._id?.toString() || t._id }));
                  setHistory(tokens);
                  setPage(1);
                })
                .catch(() => {});
            }}
          />

          <form onSubmit={handleSubmit} noValidate>
            <div className="tg-field">
              <label className="tg-label">Client Name</label>
              <input type="text" name="clientName"
                value={form.clientName} onChange={handleTextInput}
                placeholder="Enter client name"
                className={`tg-input ${errors.clientName ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.clientName && <p className="tg-error">{errors.clientName}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">
                Facility Code <span className="tg-tag">12-bit · max 4,095</span>
              </label>
              <input type="text" inputMode="numeric" name="facilityCode"
                value={form.facilityCode} onChange={handleNumberInput}
                placeholder="Enter facility code (0 – 4095)" maxLength={4}
                className={`tg-input ${errors.facilityCode ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.facilityCode && <p className="tg-error">{errors.facilityCode}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">
                Access Code <span className="tg-tag">24-bit · max 16,777,215</span>
              </label>
              <input type="text" inputMode="numeric" name="accessCode"
                value={form.accessCode} onChange={handleNumberInput}
                placeholder="Enter access code (0 – 16777215)" maxLength={8}
                className={`tg-input ${errors.accessCode ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.accessCode && <p className="tg-error">{errors.accessCode}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">First Name</label>
              <input type="text" name="firstName"
                value={form.firstName} onChange={handleTextInput}
                placeholder="Enter first name"
                className={`tg-input ${errors.firstName ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.firstName && <p className="tg-error">{errors.firstName}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">Last Name</label>
              <input type="text" name="lastName"
                value={form.lastName} onChange={handleTextInput}
                placeholder="Enter last name"
                className={`tg-input ${errors.lastName ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.lastName && <p className="tg-error">{errors.lastName}</p>}
            </div>

            <div className="tg-field">
              <label className="tg-label">Employee Email</label>
              <input type="email" name="employeeEmail"
                value={form.employeeEmail} onChange={handleEmailInput}
                placeholder="employee@company.com"
                className={`tg-input ${errors.employeeEmail ? 'tg-input--error' : ''}`} autoComplete="off" />
              {errors.employeeEmail && <p className="tg-error">{errors.employeeEmail}</p>}
            </div>

            <button type="submit" className="tg-btn" disabled={loading}>
              {loading
                ? <><span className="tg-spinner" /> Sending Token...</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Token</>}
            </button>
          </form>

          {/* Success block — shown BELOW the button after sending */}
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
                  <button
                    className={`tg-copy-btn ${copied ? 'tg-copy-btn--copied' : ''}`}
                    onClick={handleCopy}
                    title="Copy token"
                  >
                    {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                  </button>
                </div>
                <p className="tg-token-value">{sentToken}</p>
              </div>
            </div>
          )}

          {/* Error block — shown BELOW the button on failure */}
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
            Token is AES-256 encrypted and sent via secure SMTP. All tokens are saved for audit.
          </div>
        </div>

        {/* ── Right: History panel ── */}
        <div className="tg-history">

          {/* Header with calendar filter + "Delete All" button */}
          <div className="tg-history-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="tg-card-title" style={{ margin: 0 }}>Token History</h2>
              <span className="tg-history-count">{history.length} records</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Calendar button — click-to-open only, typing blocked */}
              <button type="button" className="tg-date-btn" onClick={openDatePicker}>
                <CalendarIcon />
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Pick a date'}
              </button>
              {/* Hidden native date input — NOT readOnly (breaks showPicker()); typing blocked via onKeyDown/onPaste instead */}
              <input
                ref={dateInputRef}
                type="date"
                className="tg-date-input-hidden"
                value={selectedDate}
                onChange={handleDateChange}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                tabIndex={-1}
              />

              {selectedDate && (
                <button className="tg-clear-date-btn" onClick={clearDate}>
                  Clear
                </button>
              )}
              {history.length > 0 && (
                <button
                  className="tg-delete-all-btn"
                  onClick={openDeleteAll}
                  title="Delete all token history"
                >
                  <TrashIcon /> Delete All
                </button>
              )}
            </div>
          </div>

          {/* List: loading / empty / paginated (grouped by month within the page) */}
          {histLoading ? (
            <div className="tg-history-empty"><p>Loading history...</p></div>
          ) : history.length === 0 ? (
            <div className="tg-history-empty">
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
              <p>No tokens sent yet.</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>
                Tokens you generate will appear here.
              </p>
            </div>
          ) : sourceTokens.length === 0 ? (
            <div className="tg-history-empty">
              <p>No tokens sent on this date.</p>
            </div>
          ) : (
            <>
              <div className="tg-history-list">
                {selectedDate && (
                  <p className="tg-history-group-label">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {' '}({sourceTokens.length} record{sourceTokens.length === 1 ? '' : 's'})
                  </p>
                )}

                {selectedDate ? (
                  pagedTokens.map((t) => (
                    <HistoryRow
                      key={t._id}
                      token={t}
                      onDelete={() => openDeleteSingle(t._id, history.findIndex((h) => h._id === t._id))}
                    />
                  ))
                ) : (
                  Object.entries(groupedPageTokens).map(([monthLabel, tokens]) => (
                    <div key={monthLabel} className="tg-history-group">
                      <p className="tg-history-group-label">{monthLabel}</p>
                      {tokens.map((t) => (
                        <HistoryRow
                          key={t._id}
                          token={t}
                          onDelete={() => openDeleteSingle(t._id, history.findIndex((h) => h._id === t._id))}
                        />
                      ))}
                    </div>
                  ))
                )}
              </div>

              <PaginationControls
                currentPage={page}
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

export default TokenGeneration;