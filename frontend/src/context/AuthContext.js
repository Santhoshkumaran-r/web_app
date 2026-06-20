import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [showFirstLogin, setShowFirstLogin] = useState(false);  // ← NEW

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Call this after successful login
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Show modal if first login
    if (userData.isFirstLogin) {       // ← NEW
      setShowFirstLogin(true);         // ← NEW
    }                                  // ← NEW
  };

  // Called when user completes or skips the modal
  const dismissFirstLogin = () => {   // ← NEW
    setShowFirstLogin(false);          // ← NEW
    // Update local user state so modal never shows again this session
    setUser(prev => ({ ...prev, isFirstLogin: false }));  // ← NEW
  };                                   // ← NEW

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, showFirstLogin, dismissFirstLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};