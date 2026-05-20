import React from 'react';
const VendorProducts = () => (
  <div className="admin-page">
    <div className="admin-page-header">
      <div className="admin-page-header-icon" style={{ background: '#e8eef8', color: '#0e7a5a' }}>📦</div>
      <div>
        <h1 className="admin-page-title">Products</h1>
        <p className="admin-page-subtitle">Manage your product listings and inventory.</p>
      </div>
    </div>
    <div className="coming-soon-card">
      <div className="coming-soon-icon">📦</div>
      <h2 className="coming-soon-title">Products</h2>
      <p className="coming-soon-desc">Add and manage your products here.<br />Feature coming soon.</p>
      <div className="coming-soon-features">
        <div className="coming-soon-feature">Add new products</div>
        <div className="coming-soon-feature">Edit pricing and stock</div>
        <div className="coming-soon-feature">Upload product images</div>
      </div>
    </div>
  </div>
);
export default VendorProducts;
