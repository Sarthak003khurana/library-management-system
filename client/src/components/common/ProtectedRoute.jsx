// ============================================
// PROTECTEDROUTE.JSX - Role-Based Route Navigation Guard
// Covers Syllabus:
// - Point 41: React Router Navigation Guards
// - Point 42: Nested Protected Routing
// - Point 43: Context-driven Authorization (useAuth)
// ============================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner text="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Insufficient permissions
    return <Navigate to="/" replace />;
  }

  return children;
}
