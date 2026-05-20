import React from 'react';

const UserConfiguration = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>
          👥
        </div>
        <div>
          <h1 className="admin-page-title">User Configuration</h1>
          <p className="admin-page-subtitle">
            Manage users, assign roles, and control permissions across the platform.
          </p>
        </div>
      </div>

      <div className="coming-soon-card">
        <div className="coming-soon-icon">👥</div>
        <h2 className="coming-soon-title">User Configuration</h2>
        <p className="coming-soon-desc">
          This section will allow you to manage all users and their permissions.
          <br />Feature coming soon.
        </p>
        <div className="coming-soon-features">
          <div className="coming-soon-feature">View and search all users</div>
          <div className="coming-soon-feature">Assign and change roles</div>
          <div className="coming-soon-feature">Activate or deactivate accounts</div>
          <div className="coming-soon-feature">Reset user passwords</div>
        </div>
      </div>
    </div>
  );
};

export default UserConfiguration;
