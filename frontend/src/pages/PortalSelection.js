import React from 'react';
import { Link } from 'react-router-dom';

const portals = [
  {
    role: 'admin',
    title: 'Admin Portal',
    desc: 'Full system control. Manage users, vendors, and platform settings.',
    icon: '🛡️',
    color: '#7c6bff',
    path: '/admin/login',
    cardColorA: '#7c6bff',
    cardColorB: '#a78bfa',
    features: ['User management', 'System configuration', 'Analytics & reports'],
  },
  {
    role: 'vendor',
    title: 'Vendor Portal',
    desc: 'Manage your products, orders, and business profile.',
    icon: '🏪',
    color: '#22d3a5',
    path: '/vendor/login',
    cardColorA: '#22d3a5',
    cardColorB: '#2dd4bf',
    features: ['Product listings', 'Order management', 'Revenue tracking'],
  },
  {
    role: 'user',
    title: 'User Portal',
    desc: 'Browse, shop, and manage your personal account.',
    icon: '👤',
    color: '#f59e0b',
    path: '/user/login',
    cardColorA: '#f59e0b',
    cardColorB: '#fb923c',
    features: ['Browse catalogue', 'Order history', 'Profile settings'],
  },
];

const PortalSelection = () => {
  return (
    <div className="portal-page">
      <div className="portal-bg">
        <div className="portal-bg-orb portal-bg-orb-1" />
        <div className="portal-bg-orb portal-bg-orb-2" />
      </div>

      <div className="portal-header">
        <p className="portal-eyebrow">Multi-Role Platform</p>
        <h1 className="portal-title">
          Choose your<br /><span>login portal</span>
        </h1>
        <p className="portal-desc">Select the portal that matches your account type</p>
      </div>

      <div className="portal-cards">
        {portals.map((p) => (
          <Link
            key={p.role}
            to={p.path}
            className="portal-card"
            style={{ '--card-color-a': p.cardColorA, '--card-color-b': p.cardColorB }}
          >
            <div className="portal-card-icon" style={{ background: `${p.color}22` }}>
              {p.icon}
            </div>
            <p className="portal-card-role" style={{ color: p.color }}>
              {p.role}
            </p>
            <h2 className="portal-card-title">{p.title}</h2>
            <p className="portal-card-desc">{p.desc}</p>
            <div className="portal-card-action" style={{ color: p.color }}>
              Sign in
              <div className="portal-card-arrow" style={{ background: `${p.color}22` }}>
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PortalSelection;
