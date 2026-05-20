import React from 'react';
import TokenPage from '../../components/TokenPage';

const VendorTokenGeneration = () => (
  <TokenPage
    apiBase="/vendor/token"
    accentColor="#e8f5f1"
    role="Vendor"
  />
);

export default VendorTokenGeneration;
