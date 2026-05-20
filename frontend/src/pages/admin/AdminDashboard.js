import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon, label, value, color }) => (
  <div className="dash-stat-card">
    <div className="dash-stat-icon" style={{ background: `${color}15` }}>{icon}</div>
    <div className="dash-stat-value">{value}</div>
    <div className="dash-stat-label">{label}</div>
  </div>
);

const SectionLabel = ({ color, label, badge }) => (
  <div className="dash-section-label">
    <span className="dash-section-dot" style={{ background: color }} />
    {label}
    {badge && <span className="dash-section-badge" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>{badge}</span>}
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#e3f2fd', color: '#1565c0' }}>🛡️</div>
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Welcome back, <strong>{user?.name}</strong>. Full platform visibility.</p>
        </div>
      </div>

      {/* Admin stats */}
      <div className="dash-section">
        <SectionLabel color="#1976d2" label="Admin Overview" />
        <div className="dash-card-grid">
          <StatCard icon="🛡️" label="Total Admins"      value="—" color="#1976d2" />
          <StatCard icon="🔑" label="Tokens Generated"  value="—" color="#1976d2" />
          <StatCard icon="📋" label="Audit Events"      value="—" color="#1976d2" />
          <StatCard icon="📧" label="Emails Sent"       value="—" color="#1976d2" />
        </div>
      </div>

      {/* Vendor stats */}
      <div className="dash-section">
        <SectionLabel color="#0e7a5a" label="Vendor Overview" badge="Admin View" />
        <div className="dash-card-grid">
          <StatCard icon="🏪" label="Active Vendors"  value="—" color="#0e7a5a" />
          <StatCard icon="📦" label="Total Products"  value="—" color="#0e7a5a" />
          <StatCard icon="🧾" label="Vendor Orders"   value="—" color="#0e7a5a" />
          <StatCard icon="💰" label="Total Revenue"   value="—" color="#0e7a5a" />
        </div>
      </div>

      {/* User stats */}
      <div className="dash-section">
        <SectionLabel color="#a16207" label="User Overview" badge="Admin View" />
        <div className="dash-card-grid">
          <StatCard icon="👥" label="Total Users"     value="—" color="#a16207" />
          <StatCard icon="✅" label="Active Users"    value="—" color="#a16207" />
          <StatCard icon="🛒" label="User Orders"     value="—" color="#a16207" />
          <StatCard icon="📅" label="New This Month"  value="—" color="#a16207" />
        </div>
      </div>

      {/* Quick links */}
      <div className="admin-section">
        <p className="admin-section-title">Quick Navigation</p>
        <div className="admin-quick-grid">
          {[
            { label: 'Token Generation',    desc: 'Generate & send access tokens',     path: '/admin/token-generation',    icon: '🔑', color: '#1976d2' },
            { label: 'Email Configuration', desc: 'Set up SMTP and email templates',   path: '/admin/email-configuration', icon: '📧', color: '#1976d2' },
            { label: 'User Configuration',  desc: 'Manage users, roles, permissions',  path: '/admin/user-configuration',  icon: '👥', color: '#1976d2' },
            { label: 'Audit Logs',          desc: 'View all system activity',          path: '/admin/audit-logs',          icon: '📋', color: '#1976d2' },
          ].map((item) => (
            <Link key={item.label} to={item.path} className="admin-quick-card" style={{ '--qc': item.color }}>
              <div className="admin-quick-icon" style={{ background: '#e3f2fd' }}>{item.icon}</div>
              <div>
                <p className="admin-quick-label">{item.label}</p>
                <p className="admin-quick-desc">{item.desc}</p>
              </div>
              <span className="admin-quick-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
