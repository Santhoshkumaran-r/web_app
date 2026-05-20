import React from 'react';
import { useAuth } from '../../context/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#fef9e7', color: '#a16207' }}>👤</div>
        <div>
          <h1 className="admin-page-title">My Dashboard</h1>
          <p className="admin-page-subtitle">Welcome back, <strong>{user?.name}</strong>. Here's your account summary.</p>
        </div>
      </div>
      <div className="dash-section">
        <div className="dash-section-label">
          <span className="dash-section-dot" style={{ background: '#a16207' }} />
          My Activity
        </div>
        <div className="dash-card-grid">
          {[
            { icon: '🛒', label: 'Total Orders'  },
            { icon: '📦', label: 'In Progress'   },
            { icon: '✅', label: 'Delivered'     },
            { icon: '❤️', label: 'Wishlist Items' },
          ].map((s) => (
            <div className="dash-stat-card" key={s.label}>
              <div className="dash-stat-icon" style={{ background: '#fef9e7' }}>{s.icon}</div>
              <div className="dash-stat-value">—</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
