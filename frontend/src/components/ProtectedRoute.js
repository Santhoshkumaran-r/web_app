import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f4f3f0',
        fontFamily: 'DM Sans, sans-serif', color: '#6b6760'
      }}>
        Loading...
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // Wrong role → redirect to their own dashboard
  if (role && user.role !== role) {
    const dashboards = {
      admin:  '/admin/dashboard',
      vendor: '/vendor/dashboard',
      user:   '/user/dashboard',
    };
    return <Navigate to={dashboards[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
