import React from 'react';
import { useAuth } from '../../context/AuthContext';
const UserProfile = () => {
  const { user } = useAuth();
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#fef9e7', color: '#a16207' }}>👤</div>
        <div>
          <h1 className="admin-page-title">My Profile</h1>
          <p className="admin-page-subtitle">Manage your personal information.</p>
        </div>
      </div>
      <div className="coming-soon-card">
        <div className="coming-soon-icon">👤</div>
        <h2 className="coming-soon-title">{user?.name}</h2>
        <p className="coming-soon-desc">{user?.email}<br />Profile editing coming soon.</p>
        <div className="coming-soon-features">
          <div className="coming-soon-feature">Update name and email</div>
          <div className="coming-soon-feature">Change password</div>
          <div className="coming-soon-feature">Manage addresses</div>
        </div>
      </div>
    </div>
  );
};
export default UserProfile;
