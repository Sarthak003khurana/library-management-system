// ============================================
// APP.JSX - Root Application Component & React Router Configuration
// Covers Syllabus:
// - Point 31: React Fundamentals & JSX Entry Component
// - Point 41: React Router Navigation
// - Point 42: Nested Routes with Shared AppLayout
// - Point 43: AuthProvider & ToastProvider Contexts
// - Point 45: Tailwind CSS Integrated Design System
// ============================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';

// Pages
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import TimelinePage from './pages/TimelinePage.jsx';
import WaitlistPage from './pages/WaitlistPage.jsx';
import FinesPage from './pages/FinesPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminItemsPage from './pages/admin/AdminItemsPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Application Routes with Shared Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* User Routes */}
            <Route index element={<DashboardPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="waitlist" element={<WaitlistPage />} />
            <Route path="fines" element={<FinesPage />} />

            {/* Admin & Lab Manager Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'lab_manager']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/items"
              element={
                <ProtectedRoute allowedRoles={['admin', 'lab_manager']}>
                  <AdminItemsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Only Route */}
            <Route
              path="admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
