import React from 'react';
import LoginForm from '../components/LoginForm';

// ── Admin Login ──────────────────────────────────
export const AdminLogin = () => (
  <LoginForm
    role="admin"
    config={{
      accent: '#7c6bff',
      accentDark: '#5a4dd4',
      icon: <img src="/favicon.png" alt="logo" style={{width:'40px',height:'40px',objectFit:'contain'}} />,
      title: 'Admin Control Center',
      subtitle: 'Secure access to platform management, user control, and system settings.',
      badge: 'Administrator',
      features: [
        'Full user & vendor management',
        'Platform analytics & reports',
        'System configuration & settings',
        'Role & permission control',
      ],
    }}
  />
);

// ── Vendor Login ─────────────────────────────────
export const VendorLogin = () => (
  <LoginForm
    role="vendor"
    config={{
      accent: '#22d3a5',
      accentDark: '#0ea882',
      icon: '🏪',
      title: 'Vendor Dashboard',
      subtitle: 'Manage your storefront, products, and track your business performance.',
      badge: 'Vendor',
      features: [
        'Product & inventory management',
        'Order tracking & fulfillment',
        'Revenue & payout reports',
        'Customer communication',
      ],
    }}
  />
);

// ── User Login ────────────────────────────────────
export const UserLogin = () => (
  <LoginForm
    role="user"
    config={{
      accent: '#f59e0b',
      accentDark: '#d97706',
      icon: '👤',
      title: 'Welcome Back',
      subtitle: 'Sign in to browse, shop, and manage your personal account and orders.',
      badge: 'User',
      features: [
        'Browse the full catalogue',
        'Track your orders',
        'Manage saved addresses',
        'Wishlist & preferences',
      ],
    }}
  />
);
