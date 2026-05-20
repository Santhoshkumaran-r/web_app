import React from 'react';
const UserOrders = () => (
  <div className="admin-page">
    <div className="admin-page-header">
      <div className="admin-page-header-icon" style={{ background: '#fef9e7', color: '#a16207' }}>🛒</div>
      <div>
        <h1 className="admin-page-title">My Orders</h1>
        <p className="admin-page-subtitle">View and track all your orders.</p>
      </div>
    </div>
    <div className="coming-soon-card">
      <div className="coming-soon-icon">🛒</div>
      <h2 className="coming-soon-title">My Orders</h2>
      <p className="coming-soon-desc">Your order history will appear here.<br />Feature coming soon.</p>
      <div className="coming-soon-features">
        <div className="coming-soon-feature">Track live order status</div>
        <div className="coming-soon-feature">View past orders</div>
        <div className="coming-soon-feature">Request returns</div>
      </div>
    </div>
  </div>
);
export default UserOrders;
