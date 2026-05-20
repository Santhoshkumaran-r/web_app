import React from 'react';
const VendorOrders = () => (
  <div className="admin-page">
    <div className="admin-page-header">
      <div className="admin-page-header-icon" style={{ background: '#e8eef8', color: '#0e7a5a' }}>🧾</div>
      <div>
        <h1 className="admin-page-title">Orders</h1>
        <p className="admin-page-subtitle">Track and manage orders placed for your products.</p>
      </div>
    </div>
    <div className="coming-soon-card">
      <div className="coming-soon-icon">🧾</div>
      <h2 className="coming-soon-title">Orders</h2>
      <p className="coming-soon-desc">View and process customer orders.<br />Feature coming soon.</p>
      <div className="coming-soon-features">
        <div className="coming-soon-feature">View all incoming orders</div>
        <div className="coming-soon-feature">Mark orders as fulfilled</div>
        <div className="coming-soon-feature">Handle returns and refunds</div>
      </div>
    </div>
  </div>
);
export default VendorOrders;
