import React, { useState } from 'react';
import api from '../utils/api';

const FirstLoginModal = ({ onDone }) => {
  const [mode, setMode] = useState(null); // null | 'change' | 'skip'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSkip = async () => {
    setLoading(true);
    try {
      await api.put('/auth/skip-password-change');
    } catch (e) {}
    setLoading(false);
    onDone();
  };

  const handleChangePassword = async () => {
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setError('All fields are required.');
    }
    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password changed successfully!');
      setTimeout(() => onDone(), 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to change password.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.lockIcon}>🔐</span>
          <h2 style={styles.title}>Security Notice</h2>
        </div>

        {/* Body */}
        {mode === null && (
          <>
            <p style={styles.message}>
              You are logging in for the first time. For your security, we recommend changing your password.
            </p>
            <div style={styles.buttonGroup}>
              <button style={styles.primaryBtn} onClick={() => setMode('change')}>
                Change Password
              </button>
              <button style={styles.secondaryBtn} onClick={handleSkip} disabled={loading}>
                {loading ? 'Please wait...' : 'Keep Current Password'}
              </button>
            </div>
          </>
        )}

        {mode === 'change' && (
          <>
            <p style={styles.message}>Enter your current password and choose a new one.</p>
            {error && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.successMsg}>{success}</p>}
            <input
              style={styles.input}
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
            <input
              style={styles.input}
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <input
              style={styles.input}
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <div style={styles.buttonGroup}>
              <button style={styles.primaryBtn} onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Changing...' : 'Update Password'}
              </button>
              <button style={styles.secondaryBtn} onClick={() => { setMode(null); setError(''); }}>
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  },
  modal: {
    background: '#fff', borderRadius: '12px', padding: '36px',
    width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: { textAlign: 'center', marginBottom: '16px' },
  lockIcon: { fontSize: '36px' },
  title: { fontSize: '20px', fontWeight: '700', margin: '8px 0 0', color: '#111' },
  message: { fontSize: '14px', color: '#555', textAlign: 'center', marginBottom: '24px', lineHeight: 1.6 },
  buttonGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  primaryBtn: {
    background: '#0e7a5a', color: '#fff', border: 'none',
    padding: '12px', borderRadius: '8px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
  secondaryBtn: {
    background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db',
    padding: '12px', borderRadius: '8px', fontSize: '14px',
    fontWeight: '500', cursor: 'pointer',
  },
  input: {
    width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '14px', marginBottom: '12px',
    boxSizing: 'border-box',
  },
  error: { color: '#dc2626', fontSize: '13px', marginBottom: '12px', textAlign: 'center' },
  successMsg: { color: '#16a34a', fontSize: '13px', marginBottom: '12px', textAlign: 'center' },
};

export default FirstLoginModal;