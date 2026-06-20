import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString());

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Professional SVG Icons ────────────────────────────────────────────────────
const IconBuilding = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4v18"/>
    <path d="M19 21V11l-6-4"/>
    <line x1="9" y1="9" x2="9" y2="9.01"/>
    <line x1="9" y1="12" x2="9" y2="12.01"/>
    <line x1="9" y1="15" x2="9" y2="15.01"/>
    <line x1="9" y1="18" x2="9" y2="18.01"/>
  </svg>
);
const IconTicket   = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
  </svg>
);
const IconKey      = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6"/>
    <path d="M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
);
const IconBarChart = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
);
const IconShield   = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ w = '100%', h = 18, r = 6 }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
  }} />
);

// ── Metric Card ───────────────────────────────────────────────────────────────
const MetricCard = ({ icon, label, value, color, loading }) => {
  const isText = typeof value === 'string' && isNaN(Number(value));
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${color}25`,
      borderRadius: 10,
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: `0 1px 4px ${color}10`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: `${color}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.cloneElement(icon, { size: 17, color })}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: isText ? '0.85rem' : '1.25rem',
          fontWeight: 700,
          color: isText ? color : '#111827',
          lineHeight: 1,
          letterSpacing: isText ? '0.01em' : 'normal',
        }}>
          {loading ? <Skeleton w={50} h={22} /> : value}
        </div>
        <div style={{ fontSize: '0.71rem', color: '#6b7280', fontWeight: 500, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
      </div>
    </div>
  );
};

// ── Clickable Metric Card (hover effect + redirect) ───────────────────────────
const ClickableMetricCard = ({ icon, label, value, color, loading }) => {
  const [hovered, setHovered] = React.useState(false);
  const isText = typeof value === 'string' && isNaN(Number(value));
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${color}08` : '#fff',
        border: `1px solid ${hovered ? color + '60' : color + '25'}`,
        borderRadius: 10,
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: hovered
          ? `0 4px 16px ${color}30, 0 0 0 3px ${color}15`
          : `0 1px 4px ${color}10`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: hovered ? 3 : 0,
        background: color,
        borderRadius: '10px 0 0 10px',
        transition: 'width 0.2s ease',
      }} />
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: hovered ? `${color}20` : `${color}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s ease',
      }}>
        {React.cloneElement(icon, { size: 17, color })}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: isText ? '0.85rem' : '1.25rem',
          fontWeight: 700,
          color: hovered ? color : (isText ? color : '#111827'),
          lineHeight: 1,
          letterSpacing: isText ? '0.01em' : 'normal',
          transition: 'color 0.2s ease',
        }}>
          {loading ? <Skeleton w={50} h={22} /> : value}
        </div>
        <div style={{ fontSize: '0.71rem', color: hovered ? color + 'bb' : '#6b7280', fontWeight: 500, marginTop: 3, lineHeight: 1.3, transition: 'color 0.2s ease' }}>{label}</div>
      </div>
      <div style={{
        fontSize: '0.75rem', color,
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}>→</div>
    </div>
  );
};

// ── Panel ─────────────────────────────────────────────────────────────────────
const Panel = ({ title, icon, accentColor, bgColor, children }) => (
  <div style={{
    background: '#fff',
    border: `1.5px solid ${accentColor}25`,
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: `0 2px 12px ${accentColor}12`,
    marginBottom: '1rem',
  }}>
    <div style={{
      background: `linear-gradient(135deg, ${bgColor}, ${accentColor}10)`,
      borderBottom: `1px solid ${accentColor}20`,
      padding: '0.9rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${accentColor}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: accentColor }}>{title}</span>
    </div>
    <div style={{
      padding: '1rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 12,
    }}>
      {children}
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const UserDashboard = () => {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    API.get('/dashboard/user')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const s        = data?.stats          || {};
  const activity = data?.recentActivity || [];

  const allocated = s.totalAllocated;
  const used       = s.tokensUsed || 0;
  const remaining   = s.tokensRemaining;
  const isOut       = remaining === 0 && allocated !== null;
  const isLow       = !isOut && remaining !== null && remaining <= Math.max(1, Math.floor((allocated || 0) * 0.2));
  const barColor    = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#a16207';
  const pct         = allocated > 0 ? Math.min(100, (used / allocated) * 100) : 0;

  return (
    <div className="admin-page">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* ── Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header-icon" style={{ background: '#fef9e7', color: '#a16207' }}>
          <IconBuilding size={22} color="#a16207" />
        </div>
        <div>
          <h1 className="admin-page-title">Client Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome back, <strong>{user?.name}</strong>. Here's your account overview.
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '12px 16px', marginBottom: '1.5rem', color: '#b91c1c', fontSize: '0.875rem',
        }}>{error}</div>
      )}

      {/* ── Account Overview Panel ── */}
      <div className="dash-section">
        <div className="dash-section-label">
          <span className="dash-section-dot" style={{ background: '#a16207' }} />
          Account Overview
        </div>

        <Panel
          title="Your Account"
          icon={<IconBuilding size={18} color="#a16207" />}
          accentColor="#a16207"
          bgColor="#fffbeb"
        >
          <MetricCard
            icon={<IconShield />}
            label="Account Type"
            value="Client"
            color="#a16207"
            loading={loading}
          />
          <Link to="/user/token-generation" style={{ textDecoration: 'none', display: 'block' }}>
            <ClickableMetricCard
              icon={<IconTicket />}
              label="Allocated Tokens"
              value={allocated === null ? 'Unlimited' : fmt(allocated)}
              color="#a16207"
              loading={loading}
            />
          </Link>
          <MetricCard
            icon={<IconKey />}
            label="Tokens Used"
            value={fmt(used)}
            color="#a16207"
            loading={loading}
          />
          <MetricCard
            icon={<IconBarChart />}
            label="Tokens Remaining"
            value={remaining === null ? 'Unlimited' : fmt(remaining)}
            color={isOut ? '#ef4444' : isLow ? '#f59e0b' : '#a16207'}
            loading={loading}
          />
        </Panel>
      </div>

      {/* ── Token Quota Bar ── */}
      {!loading && allocated !== null && (
        <div className="dash-section">
          <div className="dash-section-label">
            <span className="dash-section-dot" style={{ background: '#a16207' }} />
            Token Quota
          </div>
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                {isOut ? 'Token Limit Reached' : isLow ? 'Running Low' : 'Usage'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {fmt(used)} used / {fmt(allocated)} total &nbsp;·&nbsp;
                <strong style={{ color: barColor }}>{fmt(remaining)} remaining</strong>
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: '#e5e7eb', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 8, width: `${pct}%`,
                background: `linear-gradient(90deg,${barColor}88,${barColor})`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            {isOut && (
              <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: '#b91c1c', lineHeight: 1.6 }}>
                Token limit reached. Contact your <strong>vendor or admin</strong> to request more.
              </p>
            )}
            {isLow && !isOut && (
              <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.6 }}>
                Only <strong>{remaining}</strong> token{remaining !== 1 ? 's' : ''} remaining. Contact your vendor if you need more.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Recent Token Activity ── */}
      <div className="dash-section">
        <div className="dash-section-label">
          <span className="dash-section-dot" style={{ background: '#a16207' }} />
          Recent Token History
          <span className="dash-section-badge" style={{
            background: '#fffde7', color: '#a16207', border: '1px solid #ffe08230',
          }}>Latest 8</span>
          <Link
            to="/user/token-generation"
            style={{
              marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600,
              color: '#a16207', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 6,
              background: '#fffde7', border: '1px solid #fde68a',
            }}
          >
            View all →
          </Link>
        </div>
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {loading ? (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} h={20} />)}
            </div>
          ) : activity.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              No tokens generated yet.{' '}
              <Link to="/user/token-generation" style={{ color: '#a16207', fontWeight: 600 }}>Generate your first token →</Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Issued To', 'Status', 'When'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', color: '#111827', fontWeight: 500 }}>{row.employeeEmail}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                        fontSize: '0.7rem', fontWeight: 600,
                        background: row.status === 'sent' ? '#dcfce7' : '#fef2f2',
                        color:      row.status === 'sent' ? '#166534' : '#b91c1c',
                      }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#9ca3af' }}>{timeAgo(row.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;