import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = ({ icon, title, color }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-card">
        <div className="dashboard-icon">{icon}</div>
        <h1 className="dashboard-title">
          {title}
        </h1>
        <p className="dashboard-subtitle">
          Hello, <strong style={{ color }}>{user?.name || 'there'}</strong>!
        </p>
        <p className="dashboard-subtitle" style={{ fontSize: '0.875rem' }}>
          {user?.email}
        </p>
        <div className="dashboard-role" style={{ color, borderColor: `${color}40` }}>
          {user?.role}
        </div>
        <p style={{ color: '#a8a49a', fontSize: '0.875rem', marginBottom: '2rem' }}>
          You are successfully logged in. Build your dashboard content here.
        </p>
        <button className="logout-btn" onClick={handleLogout}>
          Sign out →
        </button>
      </div>
    </div>
  );
};

export const AdminDashboard = () => (
  <Dashboard icon="🛡️" title="Admin Dashboard" color="#7c6bff" />
);

export const VendorDashboard = () => (
  <Dashboard icon="🏪" title="Vendor Dashboard" color="#22d3a5" />
);

export const UserDashboard = () => (
  <Dashboard icon="👤" title="My Account" color="#f59e0b" />
);
