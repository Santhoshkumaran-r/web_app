import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout   from './components/AdminLayout';
import VendorLayout  from './components/VendorLayout';
import UserLayout    from './components/UserLayout';

import Login from './pages/Login';

// Admin pages
import AdminDashboard       from './pages/admin/AdminDashboard';
import AdminTokenGeneration from './pages/admin/TokenGeneration';
import EmailConfiguration   from './pages/admin/EmailConfiguration';
import UserConfiguration    from './pages/admin/UserConfiguration';
import AuditLogs            from './pages/admin/AuditLogs';

// Vendor pages
import VendorDashboard       from './pages/vendor/VendorDashboard';
import VendorTokenGeneration from './pages/vendor/VendorTokenGeneration';
import VendorProducts        from './pages/vendor/VendorProducts';
import VendorOrders          from './pages/vendor/VendorOrders';

// User pages
import UserDashboard       from './pages/user/UserDashboard';
import UserTokenGeneration from './pages/user/UserTokenGeneration';
import UserOrders          from './pages/user/UserOrders';
import UserProfile         from './pages/user/UserProfile';

import './styles.css';

const AdminPage  = ({ children }) => <ProtectedRoute role="admin"><AdminLayout>{children}</AdminLayout></ProtectedRoute>;
const VendorPage = ({ children }) => <ProtectedRoute role="vendor"><VendorLayout>{children}</VendorLayout></ProtectedRoute>;
const UserPage   = ({ children }) => <ProtectedRoute role="user"><UserLayout>{children}</UserLayout></ProtectedRoute>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Admin ── */}
          <Route path="/admin/dashboard"           element={<AdminPage><AdminDashboard /></AdminPage>} />
          <Route path="/admin/token-generation"    element={<AdminPage><AdminTokenGeneration /></AdminPage>} />
          <Route path="/admin/email-configuration" element={<AdminPage><EmailConfiguration /></AdminPage>} />
          <Route path="/admin/user-configuration"  element={<AdminPage><UserConfiguration /></AdminPage>} />
          <Route path="/admin/audit-logs"          element={<AdminPage><AuditLogs /></AdminPage>} />

          {/* ── Vendor ── */}
          <Route path="/vendor/dashboard"        element={<VendorPage><VendorDashboard /></VendorPage>} />
          <Route path="/vendor/token-generation" element={<VendorPage><VendorTokenGeneration /></VendorPage>} />
          <Route path="/vendor/products"         element={<VendorPage><VendorProducts /></VendorPage>} />
          <Route path="/vendor/orders"           element={<VendorPage><VendorOrders /></VendorPage>} />

          {/* ── User ── */}
          <Route path="/user/dashboard"        element={<UserPage><UserDashboard /></UserPage>} />
          <Route path="/user/token-generation" element={<UserPage><UserTokenGeneration /></UserPage>} />
          <Route path="/user/my-orders"        element={<UserPage><UserOrders /></UserPage>} />
          <Route path="/user/profile"          element={<UserPage><UserProfile /></UserPage>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
