import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  {
    path: '/vendor/dashboard',
    label: 'Dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    path: '/vendor/email-configuration',
    label: 'Email Configuration',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  },
  {
    path: '/vendor/token-generation',
    label: 'Token Generation',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  },
  {
    path: '/vendor/user-management',
    label: 'User Management',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
];

// ── Logout Confirmation Modal ─────────────────────────────────────────────────
const LogoutModal = ({ user, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{
      background: '#fff', borderRadius: 16, padding: '32px 28px',
      width: '100%', maxWidth: 380,
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: '#fef2f2', border: '1.5px solid #fecaca',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </div>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#111827', textAlign: 'center' }}>
        Sign Out
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', lineHeight: 1.6 }}>
        Are you sure you want to sign out?
        {user?.name && (
          <><br /><strong style={{ color: '#374151' }}>{user.name}</strong> will need to log in again to access the portal.</>
        )}
      </p>
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '10px 0', borderRadius: 8,
          border: '1.5px solid #e5e7eb', background: '#fff',
          fontSize: '0.875rem', fontWeight: 600, color: '#374151', cursor: 'pointer',
        }}>Stay</button>
        <button onClick={onConfirm} style={{
          flex: 1, padding: '10px 0', borderRadius: 8,
          border: 'none', background: '#ef4444',
          fontSize: '0.875rem', fontWeight: 600, color: '#fff', cursor: 'pointer',
        }}>Yes, Sign Out</button>
      </div>
    </div>
  </div>
);

// ── Main Layout ───────────────────────────────────────────────────────────────
const VendorLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed,       setCollapsed]       = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick   = () => setShowLogoutModal(true);
  const handleLogoutCancel  = () => setShowLogoutModal(false);
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      {showLogoutModal && (
        <LogoutModal user={user} onConfirm={handleLogoutConfirm} onCancel={handleLogoutCancel} />
      )}
      <aside className={`admin-sidebar vendor-sidebar ${collapsed ? 'collapsed' : ''}`}>

        {/* ── Logo / Brand ── */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ color: '#0aefaa' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#09c78e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          {!collapsed && (
            <span className="sidebar-logo-text" style={{ fontWeight: 700 }}>
              {user?.name || 'Vendor Portal'}
            </span>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active vendor-active' : ''}`}
              title={collapsed ? item.label : ''}>
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" style={{ background: '#22d3a5' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <p className="sidebar-user-name">{user?.name}</p>
                <p className="sidebar-user-role">Vendor</p>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={handleLogoutClick} title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
};

export default VendorLayout;