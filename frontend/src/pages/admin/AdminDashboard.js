import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

// ── Professional SVG Icons ────────────────────────────────────────────────────
const IconShield     = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconTicket     = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
  </svg>
);
const IconKey        = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6"/>
    <path d="M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
);
const IconBarChart   = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
);
const IconStore      = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconInfinity   = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/>
    <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
  </svg>
);
const IconUsers      = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

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

const Skeleton = ({ w = '100%', h = 18, r = 6 }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
  }} />
);

// ── Metric Card — horizontal row inside panel ─────────────────────────────────
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

// ── Clickable Metric Card — with hover shading for linked cards ───────────────
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
          color: isText ? (hovered ? color : color) : (hovered ? color : '#111827'),
          lineHeight: 1,
          letterSpacing: isText ? '0.01em' : 'normal',
          transition: 'color 0.2s ease',
        }}>
          {loading ? <Skeleton w={50} h={22} /> : value}
        </div>
        <div style={{ fontSize: '0.71rem', color: hovered ? color + 'bb' : '#6b7280', fontWeight: 500, marginTop: 3, lineHeight: 1.3, transition: 'color 0.2s ease' }}>{label}</div>
      </div>

      <div style={{
        fontSize: '0.75rem', color: color,
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
  <div
    style={{
      background: '#fff',
      border: `1.5px solid ${accentColor}25`,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: `0 2px 12px ${accentColor}12`,
      marginBottom: '1rem',
    }}
  >
    <div
      style={{
        background: `linear-gradient(135deg, ${bgColor}, ${accentColor}10)`,
        borderBottom: `1px solid ${accentColor}20`,
        padding: '0.9rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${accentColor}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontWeight: 700,
          fontSize: '0.9rem',
          color: accentColor,
        }}
      >
        {title}
      </span>
    </div>

    {/* Horizontal Cards */}
    <div
      style={{
        padding: '1rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
      }}
    >
      {children}
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user } = useAuth();
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [recentVendors, setRecentVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/admin')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));

    API.get('/admin/credentials/list?role=vendor')
      .then((res) => {
        const sorted = (res.data.accounts || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 8);
        setRecentVendors(sorted);
      })
      .catch(() => setRecentVendors([]))
      .finally(() => setVendorsLoading(false));
  }, []);

  const s        = data?.stats          || {};
  const activity = data?.recentActivity || [];

  return (
    <div className="admin-page">
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .dash-three-col {
          display: flex;
          flex-direction: row;
          gap: 1rem;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .dash-three-col { flex-direction: column; }
        }
      `}</style>

      {/* Header */}
      <div className="admin-page-header">
      <div className="admin-page-header-icon" style={{ background: '#e3f2fd' }}>
  <img src="/favicon.png" alt="logo" style={{width:'28px',height:'28px',objectFit:'contain'}} />
</div>
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome back, <strong>{user?.name}</strong>. Full platform visibility.
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '12px 16px', marginBottom: '1.5rem', color: '#b91c1c', fontSize: '0.875rem',
        }}> {error}</div>
      )}

      {/* ── THREE HORIZONTAL PANELS ─────────────────────────────────────────── */}
      <div className="dash-section">
        <div className="dash-section-label">
          <span className="dash-section-dot" style={{ background: '#1976d2' }} />
          Platform Overview
        </div>

        <div className="dash-three-col" style={{display: 'flex',flexDirection: 'column',gap: '1rem',}}>

         {/* ADMIN */}
<Panel
  title="Admin"
  icon={
    <img
      src="/favicon.png"
      alt="logo"
      style={{
        width: '22px',
        height: '22px',
        objectFit: 'contain',
      }}
    />
  }
  accentColor="#7c6bff"
  bgColor="#f5f3ff"
>
  <MetricCard
    icon={<IconShield />}
    label="Total Admins"
    value={fmt(s.totalAdmins)}
    color="#7c6bff"
    loading={loading}
  />

  <MetricCard
    icon={<IconInfinity />}
    label="Token Limit"
    value="Unlimited"
    color="#7c6bff"
    loading={loading}
  />

  <MetricCard
    icon={<IconKey />}
    label="Admin Generated Tokens"
    value={fmt(s.adminTokensGenerated)}
    color="#7c6bff"
    loading={loading}
  />

  <MetricCard
    icon={<IconBarChart />}
    label="Remaining Tokens"
    value="Unlimited"
    color="#7c6bff"
    loading={loading}
  />
</Panel>

{/* VENDOR */}
<Panel
  title="Vendor"
  icon={<IconStore size={18} color="#0e7a5a" />}
  accentColor="#0e7a5a"
  bgColor="#f0fdf8"
>
  <Link to="/admin/user-configuration" style={{ textDecoration: 'none', display: 'block' }}>
    <ClickableMetricCard
      icon={<IconStore />}
      label="Total Vendors"
      value={fmt(s.totalVendors)}
      color="#0e7a5a"
      loading={loading}
    />
  </Link>

  <MetricCard
    icon={<IconTicket />}
    label="Allocated Tokens"
    value={fmt(s.vendorTotalAllocated)}
    color="#0e7a5a"
    loading={loading}
  />

  <MetricCard
    icon={<IconKey />}
    label="Generated Tokens"
    value={fmt(s.vendorTokensGenerated)}
    color="#0e7a5a"
    loading={loading}
  />

  <MetricCard
    icon={<IconBarChart />}
    label="Remaining Tokens"
    value={fmt(s.vendorTotalRemaining)}
    color="#0e7a5a"
    loading={loading}
  />
</Panel>

        </div>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────────────── */}
      <div className="dash-section">
        <div className="dash-section-label">
          <span className="dash-section-dot" style={{ background: '#a16207' }} />
          Recent Token Activity
          <span className="dash-section-badge" style={{
            background: '#fffde7', color: '#a16207', border: '1px solid #ffe08230',
          }}>Latest 8</span>
          <Link
            to="/admin/token-generation"
            style={{
              marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600,
              color: '#a16207', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 6,
              background: '#fffde7', border: '1px solid #fde68a',
              transition: 'all 0.15s ease',
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
              No token activity yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Issued To', 'Generated By', 'Status', 'When'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', color: '#111827', fontWeight: 500 }}>{row.employeeEmail}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{row.generatedByEmail || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                        fontSize: '0.7rem', fontWeight: 600,
                        background: row.status === 'sent' ? '#dcfce7' : '#fef2f2',
                        color:      row.status === 'sent' ? '#166534' : '#b91c1c',
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#9ca3af' }}>{timeAgo(row.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Recently Added Vendors ───────────────────────────────────────────── */}
      <div className="dash-section">
        <div className="dash-section-label">
          <span className="dash-section-dot" style={{ background: '#0e7a5a' }} />
          Recently Added Vendors
          <span className="dash-section-badge" style={{
            background: '#f0fdf4', color: '#0e7a5a', border: '1px solid #bbf7d020',
          }}>Latest 8</span>
          <Link
            to="/admin/user-configuration"
            style={{
              marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600,
              color: '#0e7a5a', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 6,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              transition: 'all 0.15s ease',
            }}
          >
            View all →
          </Link>
        </div>

        <div style={{
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {vendorsLoading ? (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} h={20} />)}
            </div>
          ) : recentVendors.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, opacity: 0.4 }}>
                <IconStore size={36} color="#0e7a5a" />
              </div>
              <p style={{ margin: 0, fontWeight: 500 }}>No vendors created yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                <Link to="/admin/user-configuration" style={{ color: '#0e7a5a', fontWeight: 600 }}>
                  Create your first vendor →
                </Link>
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Vendor', 'Email', 'Token Limit', 'Usage', 'Added'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentVendors.map((v, i) => {
                  const used      = v.tokensUsed  || 0;
                  const limit     = v.tokenLimit;
                  const pct       = limit ? Math.min(100, (used / limit) * 100) : null;
                  const remaining = limit ? Math.max(0, limit - used) : null;
                  const barColor  = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#0e7a5a';
                  return (
                    <tr key={v._id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>

                      {/* Avatar + Name */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            background: '#dcfce7', color: '#0e7a5a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.8rem', border: '1.5px solid #bbf7d0',
                          }}>
                            {(v.name || v.email)?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{v.name || '—'}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '10px 14px', color: '#6b7280', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.email}
                      </td>

                      {/* Token Limit */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 9px', borderRadius: 20,
                          fontSize: '0.7rem', fontWeight: 600,
                          background: limit ? '#eff6ff' : '#f0fdf4',
                          color:      limit ? '#1d4ed8' : '#0e7a5a',
                          border:     `1px solid ${limit ? '#bfdbfe' : '#bbf7d0'}`,
                        }}>
                          {limit ? `${fmt(limit)} tokens` : 'Unlimited'}
                        </span>
                      </td>

                      {/* Usage bar */}
                      <td style={{ padding: '10px 14px', minWidth: 110 }}>
                        {limit ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 3 }}>
                              <span style={{ color: '#6b7280' }}>{used}/{limit}</span>
                              <span style={{ fontWeight: 600, color: remaining === 0 ? '#ef4444' : remaining <= 3 ? '#f59e0b' : '#16a34a' }}>
                                {remaining === 0 ? 'Full' : `${remaining} left`}
                              </span>
                            </div>
                            <div style={{ height: 4, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: barColor, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>—</span>
                        )}
                      </td>

                      {/* Added date */}
                      <td style={{ padding: '10px 14px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {v.createdAt
                          ? new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;