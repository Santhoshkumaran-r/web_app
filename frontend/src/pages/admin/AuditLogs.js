import React from 'react';

const AuditLogs = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>
          📋
        </div>
        <div>
          <h1 className="admin-page-title">Audit Logs</h1>
          <p className="admin-page-subtitle">
            Track and review all system activity, login events, and admin actions.
          </p>
        </div>
      </div>

      <div className="coming-soon-card">
        <div className="coming-soon-icon">📋</div>
        <h2 className="coming-soon-title">Audit Logs</h2>
        <p className="coming-soon-desc">
          This section will display a full history of all system events and actions.
          <br />Feature coming soon.
        </p>
        <div className="coming-soon-features">
          <div className="coming-soon-feature">Login and logout events</div>
          <div className="coming-soon-feature">Admin actions and changes</div>
          <div className="coming-soon-feature">Filter logs by date and user</div>
          <div className="coming-soon-feature">Export logs as CSV</div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
