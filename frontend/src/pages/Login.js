import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [view, setView] = useState('login'); // 'login' | 'forgot'
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await loginUser({ email: form.email, password: form.password });
      login(res.data.user, res.data.token);

      // Route based on role
      const role = res.data.user.role;
      if (role === 'admin')  navigate('/admin/dashboard');
      if (role === 'vendor') navigate('/vendor/dashboard');
      if (role === 'user')   navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password View ──────────────────────
  if (view === 'forgot') {
    return (
      <div className="login-page" style={{ '--accent': '#1976d2' }}>
        <div className="bg-decoration">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-grid" />
        </div>
        <div className="login-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="form-card" style={{ maxWidth: 420 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
              <h2 className="form-title">Forgot Password?</h2>
              <p className="form-subtitle" style={{ marginTop: '0.5rem' }}>
                Password resets are managed by the system administrator.
              </p>
            </div>

            <div className="fp-contact-box">
              <div className="fp-contact-icon">👨‍💻</div>
              <div>
                <p className="fp-contact-title">Contact the Developer</p>
                <p className="fp-contact-desc">
                  Please reach out to your system administrator or developer to reset your password. They will verify your identity and update your credentials directly.
                </p>
              </div>
            </div>

            <button
              className="submit-btn"
              style={{ marginTop: '1.5rem' }}
              onClick={() => setView('login')}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login View ────────────────────────────────
  return (
    <div className="login-page" style={{ '--accent': '#1976d2' }}>
      <div className="bg-decoration">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />
      </div>

      <div className="login-container">
        {/* Left branding panel */}
        <div className="login-left">
          <div className="brand-icon">🛡️</div>
          <h1 className="brand-title">Welcome to the Platform</h1>
          <p className="brand-subtitle">
            A unified workspace for admins, vendors, and users. Sign in with your credentials to access your dashboard.
          </p>
          <div className="feature-list">
            <div className="feature-item"><span className="feature-dot" />Secure role-based access</div>
            <div className="feature-item"><span className="feature-dot" />Single sign-in for all roles</div>
            <div className="feature-item"><span className="feature-dot" />Admin has full platform visibility</div>
            <div className="feature-item"><span className="feature-dot" />Your data is always protected</div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-right">
          <div className="form-card">
            <div className="form-header">
              <h2 className="form-title">Sign in</h2>
              <p className="form-subtitle">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="error-banner">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password">Password</label>
                  <button
                    type="button"
                    className="fp-link"
                    onClick={() => setView('forgot')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-wrapper">
                  <svg className="input-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? <><span className="spinner" /> Signing in...</>
                  : 'Sign in →'
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
