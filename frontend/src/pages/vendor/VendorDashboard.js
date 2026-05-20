import React from 'react';
import { useAuth } from '../../context/AuthContext';

const VendorDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#e8f5f1', color: '#0e7a5a' }}>🏪</div>
        <div>
          <h1 className="admin-page-title">Vendor Dashboard</h1>
          <p className="admin-page-subtitle">Welcome back, <strong>{user?.name}</strong>. Here's your store overview.</p>
        </div>
      </div>
      <div className="dash-section">
        <div className="dash-section-label">
          <span className="dash-section-dot" style={{ background: '#0e7a5a' }} />
          Store Overview
        </div>
        <div className="dash-card-grid">
          {[
            { icon: '📦', label: 'Total Products' },
            { icon: '🧾', label: 'Total Orders'   },
            { icon: '💰', label: 'Revenue'         },
            { icon: '⭐', label: 'Avg Rating'      },
          ].map((s) => (
            <div className="dash-stat-card" key={s.label}>
              <div className="dash-stat-icon" style={{ background: '#e8f5f1' }}>{s.icon}</div>
              <div className="dash-stat-value">—</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
