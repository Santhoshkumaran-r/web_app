import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import API from '../utils/api';
// NOTE: adjust the '../utils/api' import path above to match wherever this
// file actually lives relative to your utils/ folder (same rule as the
// existing TokenPage.js / TokenGeneration.js imports).

const REQUIRED_HEADERS = ['Facility Code', 'Access Code', 'Employee Email'];
const HEADER_KEY_MAP = {
  'Facility Code':   'facilityCode',
  'Access Code':     'accessCode',
  'Employee Email':  'employeeEmail',
};
const MAX_ROWS = 2000; // keep in sync with MAX_BULK_ROWS on the backend

const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);

/**
 * Reusable Excel bulk-import panel for token generation.
 *
 * Props:
 *  - importEndpoint: string — base API path (e.g. '/admin/token' or the
 *    `apiBase` prop already used for the single-token flow). Panel POSTs to
 *    `${importEndpoint}/bulk-import` and polls `${importEndpoint}/bulk-import/:id/status`.
 *  - onComplete: () => void — called once the job finishes, so the parent
 *    page can refresh its token history (and quota, for vendor/user).
 */
const ExcelImportPanel = ({ importEndpoint, onComplete }) => {
  const [open, setOpen]               = useState(false);
  const [fileName, setFileName]       = useState('');
  const [parsedRows, setParsedRows]   = useState([]);
  const [parseError, setParseError]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [jobStatus, setJobStatus]     = useState(null); // { total, processed, completed, results }
  const fileInputRef = useRef(null);
  const pollRef       = useRef(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setFileName(''); setParsedRows([]); setParseError('');
    setSubmitting(false); setJobStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const togglePanel = () => {
    if (open) reset();
    setOpen((o) => !o);
  };

  // ── Download a blank template with one example row ─────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      REQUIRED_HEADERS,
      [926, 1234, 'jane.doe@example.com'],
    ]);
    ws['!cols'] = REQUIRED_HEADERS.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tokens');
    XLSX.writeFile(wb, 'token_import_template.xlsx');
  };

  // ── Parse the uploaded file client-side (format/preview check only —
  //     the backend re-validates every row before generating anything) ───────
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParseError(''); setParsedRows([]); setJobStatus(null); setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (raw.length === 0) { setParseError('That file has no data rows.'); return; }

        const actualHeaders = Object.keys(raw[0]).map((k) => k.trim().toLowerCase());
        const missing = REQUIRED_HEADERS.filter((h) => !actualHeaders.includes(h.toLowerCase()));
        if (missing.length > 0) {
          setParseError(`Missing column(s): ${missing.join(', ')}. Use "Download Template" for the exact format.`);
          return;
        }

        const mapped = raw.map((r) => {
          const row = {};
          Object.entries(HEADER_KEY_MAP).forEach(([header, key]) => {
            const actualKey = Object.keys(r).find((k) => k.trim().toLowerCase() === header.toLowerCase());
            row[key] = actualKey !== undefined ? String(r[actualKey]).trim() : '';
          });
          return row;
        });

        if (mapped.length > MAX_ROWS) {
          setParseError(`${mapped.length} rows found — max ${MAX_ROWS} per import. Split the file and upload in batches.`);
          return;
        }

        setParsedRows(mapped);
      } catch (err) {
        setParseError('Could not read this file. Make sure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Kick off the backend job, then poll for progress ────────────────────────
  const poll = (jobId) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await API.get(`${importEndpoint}/bulk-import/${jobId}/status`);
        setJobStatus(res.data);
        if (res.data.completed) {
          clearInterval(pollRef.current);
          setSubmitting(false);
          onComplete && onComplete();
        }
      } catch {
        clearInterval(pollRef.current);
        setSubmitting(false);
        setParseError('Lost connection while checking import progress. Check Token History to see what went through.');
      }
    }, 1500);
  };

  const startImport = async () => {
    setSubmitting(true); setParseError(''); setJobStatus(null);
    try {
      const res = await API.post(`${importEndpoint}/bulk-import`, { rows: parsedRows });
      poll(res.data.jobId);
    } catch (err) {
      setSubmitting(false);
      setParseError(err.response?.data?.message || 'Failed to start the import.');
    }
  };

  const downloadFailedReport = () => {
    const failed = (jobStatus?.results || []).filter((r) => r.status === 'failed');
    if (failed.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(failed.map((f) => ({ Row: f.row, 'Employee Email': f.employeeEmail, Reason: f.message })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Rows');
    XLSX.writeFile(wb, 'failed_import_rows.xlsx');
  };

  const successCount = (jobStatus?.results || []).filter((r) => r.status === 'success').length;
  const failedCount  = (jobStatus?.results || []).filter((r) => r.status === 'failed').length;
  const pct = jobStatus && jobStatus.total > 0 ? Math.round((jobStatus.processed / jobStatus.total) * 100) : 0;

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button type="button" className="tg-btn" style={{ background: '#fff', color: '#1565c0', border: '1.5px solid #90caf9' }} onClick={togglePanel}>
        <UploadIcon /> {open ? 'Close Excel Import' : 'Import from Excel'}
      </button>

      {open && (
        <div style={{ marginTop: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 18 }}>

          {!jobStatus && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151' }}>
                  Upload an Excel file to generate and email tokens for many users at once.
                </p>
                <button type="button" onClick={downloadTemplate}
                  style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Download Template
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} disabled={submitting}
                style={{ fontSize: '0.85rem' }} />

              {fileName && parsedRows.length > 0 && !parseError && (
                <p style={{ marginTop: 10, fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileIcon /> {fileName} — {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} ready to import
                </p>
              )}

              {parseError && (
                <div className="tg-banner tg-banner--error" style={{ marginTop: 10 }}>
                  <span className="tg-banner-icon">✕</span>
                  <div><p className="tg-banner-sub" style={{ margin: 0 }}>{parseError}</p></div>
                </div>
              )}

              {parsedRows.length > 0 && !parseError && (
                <button type="button" className="tg-btn" style={{ marginTop: 14 }} disabled={submitting} onClick={startImport}>
                  {submitting ? <><span className="tg-spinner" /> Starting Import...</> : `Generate ${parsedRows.length} Token${parsedRows.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </>
          )}

          {jobStatus && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', color: '#374151' }}>
                <span>{jobStatus.completed ? 'Import complete' : 'Processing…'}</span>
                <span>{jobStatus.processed} / {jobStatus.total}</span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: '#e5e7eb', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: jobStatus.completed ? '#16a34a' : '#1976d2', transition: 'width 0.3s ease' }} />
              </div>

              {jobStatus.completed && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.82rem' }}>
                  <span style={{ color: '#166534', fontWeight: 600 }}>✓ {successCount} sent</span>
                  {failedCount > 0 && <span style={{ color: '#b91c1c', fontWeight: 600 }}>✕ {failedCount} failed</span>}
                </div>
              )}

              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                {jobStatus.results.map((r, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', gap: 10,
                    padding: '8px 12px', fontSize: '0.78rem',
                    borderBottom: idx < jobStatus.results.length - 1 ? '1px solid #f3f4f6' : 'none',
                    color: r.status === 'success' ? '#166534' : '#b91c1c',
                  }}>
                    <span>Row {r.row} — {r.employeeEmail || '(no email)'}</span>
                    <span style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>{r.status === 'success' ? '✓ sent' : r.message}</span>
                  </div>
                ))}
              </div>

              {jobStatus.completed && (
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  {failedCount > 0 && (
                    <button type="button" className="tg-btn" style={{ background: '#fff', color: '#b91c1c', border: '1.5px solid #fecaca' }} onClick={downloadFailedReport}>
                      Download Failed Rows
                    </button>
                  )}
                  <button type="button" className="tg-btn" style={{ background: '#fff', color: '#374151', border: '1.5px solid #d1d5db' }} onClick={reset}>
                    Import Another File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelImportPanel;