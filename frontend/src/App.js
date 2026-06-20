import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';        // ← ADD
import FirstLoginModal from './components/FirstLoginModal'; // ← ADD
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

// Vendor pages
import VendorDashboard       from './pages/vendor/VendorDashboard';
import VendorTokenGeneration from './pages/vendor/VendorTokenGeneration';
import VendorUserManagement  from './pages/vendor/VendorUserManagement';
import VendorEmailConfiguration from './pages/vendor/VendorEmailConfiguration';
// User pages
import UserDashboard       from './pages/user/UserDashboard';
import UserTokenGeneration from './pages/user/UserTokenGeneration';
import UserEmailConfiguration from './pages/user/UserEmailConfiguration';

import './styles.css';

const AdminPage  = ({ children }) => <ProtectedRoute role="admin"><AdminLayout>{children}</AdminLayout></ProtectedRoute>;
const VendorPage = ({ children }) => <ProtectedRoute role="vendor"><VendorLayout>{children}</VendorLayout></ProtectedRoute>;
const UserPage   = ({ children }) => <ProtectedRoute role="user"><UserLayout>{children}</UserLayout></ProtectedRoute>;

// ← ADD: Inner wrapper that can access AuthContext
const AppRoutes = () => {
  const { showFirstLogin, dismissFirstLogin } = useAuth();

  return (
    <>
      {showFirstLogin && <FirstLoginModal onDone={dismissFirstLogin} />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard"           element={<AdminPage><AdminDashboard /></AdminPage>} />
        <Route path="/admin/token-generation"    element={<AdminPage><AdminTokenGeneration /></AdminPage>} />
        <Route path="/admin/email-configuration" element={<AdminPage><EmailConfiguration /></AdminPage>} />
        <Route path="/admin/user-configuration"  element={<AdminPage><UserConfiguration /></AdminPage>} />

        {/* ── Vendor ── */}
        <Route path="/vendor/dashboard"        element={<VendorPage><VendorDashboard /></VendorPage>} />
        <Route path="/vendor/token-generation" element={<VendorPage><VendorTokenGeneration /></VendorPage>} />
        <Route path="/vendor/user-management"  element={<VendorPage><VendorUserManagement /></VendorPage>} />
        <Route path="/vendor/email-configuration" element={<VendorPage><VendorEmailConfiguration /></VendorPage>} />
        
        {/* ── User ── */}
        <Route path="/user/dashboard"        element={<UserPage><UserDashboard /></UserPage>} />
        <Route path="/user/token-generation" element={<UserPage><UserTokenGeneration /></UserPage>} />
        <Route path="/user/email-configuration" element={<UserPage><UserEmailConfiguration /></UserPage>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />   {/* ← CHANGED from direct Routes to AppRoutes */}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;