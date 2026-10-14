// ============================================
// AUTHCONTEXT.JSX - Global Authentication State
// Covers Syllabus:
// - Point 43: Context API and Global State
// - Point 46: Authentication State and Role Authorization
// - Point 35: useState for Auth Status & User Info
// - Point 39: useEffect for Initial Session Loading
// ============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';
import { Storage } from '../utils/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => Storage.get('user', null));
  const [token, setToken] = useState(() => Storage.get('token', null));
  const [loading, setLoading] = useState(true);

  // Initialize and verify session on load
  useEffect(() => {
    try {
      const storedUser = Storage.get('user', null);
      const storedToken = Storage.get('token', null);
      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    setToken(res.token);
    return res;
  };

  const register = async (name, email, password, role) => {
    const res = await authService.register(name, email, password, role);
    setUser(res.user);
    setToken(res.token);
    return res;
  };

  const loginWithGoogle = async () => {
    const res = await authService.loginWithGoogle();
    setUser(res.user);
    setToken(res.token);
    return res;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await authService.changePassword(currentPassword, newPassword);
    if (res.user) {
      setUser(res.user);
    } else {
      setUser((prev) => prev ? { ...prev, mustChangePassword: false } : null);
    }
    if (res.token) {
      setToken(res.token);
    }
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const updateUser = (updated) => {
    setUser((prev) => {
      const next = { ...prev, ...updated };
      Storage.set('user', next);
      return next;
    });
  };

  // Role helper utilities
  const role = user?.role || 'student';
  const isAdmin = role === 'admin';
  const isLabManager = role === 'lab_manager';
  const isManager = isAdmin || isLabManager;
  const isFaculty = role === 'faculty';
  const isStudent = role === 'student';
  const mustChangePassword = user?.mustChangePassword === true;

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    mustChangePassword,
    role,
    isAdmin,
    isLabManager,
    isManager,
    isFaculty,
    isStudent,
    login,
    register,
    loginWithGoogle,
    changePassword,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
