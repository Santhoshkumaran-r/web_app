import React from 'react';

const EmailConfiguration = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>
          📧
        </div>
        <div>
          <h1 className="admin-page-title">Email Configuration</h1>
          <p className="admin-page-subtitle">
            Configure SMTP settings and manage email templates for system notifications.
          </p>
        </div>
      </div>

      <div className="coming-soon-card">
        <div className="coming-soon-icon">📧</div>
        <h2 className="coming-soon-title">Email Configuration</h2>
        <p className="coming-soon-desc">
          This section will allow you to configure email settings and templates.
          <br />Feature coming soon.
        </p>
        <div className="coming-soon-features">
          <div className="coming-soon-feature">Configure SMTP server</div>
          <div className="coming-soon-feature">Set sender name and address</div>
          <div className="coming-soon-feature">Manage email templates</div>
          <div className="coming-soon-feature">Send test emails</div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfiguration;
