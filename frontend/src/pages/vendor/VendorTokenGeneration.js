import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TokenGeneration from '../../pages/admin/TokenGeneration';
import API from '../../utils/api';

const EmailWarningBanner = () => (
  <div style={{
    background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10,
    padding: '14px 18px', marginBottom: '1.5rem',
    display: 'flex', alignItems: 'flex-start', gap: 12,
  }}>
    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}></span>
    <div>
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.875rem', color: '#92400e' }}>
        Email Not Configured
      </p>
      <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f', lineHeight: 1.6 }}>
        You need to configure your email before generating tokens. Tokens are sent to employees via email.{' '}
        <Link to="/vendor/email-configuration" style={{ color: '#0e7a5a', fontWeight: 600, textDecoration: 'underline' }}>
          Set up Email Configuration →
        </Link>
      </p>
    </div>
  </div>
);

const VendorTokenGeneration = () => {
  const [emailReady, setEmailReady] = useState(null);

  useEffect(() => {
    API.get('/admin/email-config/vendor')
      .then(res => {
        const c = res.data.config;
        setEmailReady(!!(c.isEnabled && c.smtpUser && c.smtpPass));
      })
      .catch(() => setEmailReady(false));
  }, []);

  return (
    <div>
      {emailReady === false && (
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <EmailWarningBanner />
        </div>
      )}
      <div style={{ opacity: emailReady === false ? 0.45 : 1, pointerEvents: emailReady === false ? 'none' : 'auto' }}>
        <TokenGeneration
          apiBase="/vendor/token"
          accentColor="#e8f5f1"
          role="Vendor"
        />
      </div>
    </div>
  );
};

export default VendorTokenGeneration;