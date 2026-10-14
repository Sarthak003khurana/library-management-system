// ============================================
// AUTHSERVICE.JS - Authentication API Integration
// Covers:
// - Traditional email/password login & registration
// - Firebase Google Popup Sign-In
// - Forced temporary password change
// - Session token management
// ============================================

import { API } from './api.js';
import { Storage } from '../utils/storage.js';
import { auth, googleProvider, signInWithPopup, signOut } from './firebase.js';

export const authService = {
  // Get currently saved user
  getCurrentUser() {
    return Storage.get('user', null);
  },

  // Check if token exists
  isLoggedIn() {
    return !!Storage.get('token');
  },

  // Standard Email/Password Login
  async login(email, password) {
    const data = await API.post('/api/auth/login', { email, password });
    if (data.token) Storage.set('token', data.token);
    if (data.user) Storage.set('user', data.user);
    return data;
  },

  // Register user (if enabled)
  async register(name, email, password, role = 'student') {
    const data = await API.post('/api/auth/register', { name, email, password, role });
    if (data.token) Storage.set('token', data.token);
    if (data.user) Storage.set('user', data.user);
    return data;
  },

  // Forced / User Password Change
  async changePassword(currentPassword, newPassword) {
    const data = await API.post('/api/auth/change-password', {
      currentPassword,
      newPassword
    });

    if (data.token) Storage.set('token', data.token);
    
    if (data.user) {
      Storage.set('user', data.user);
    } else {
      const currentUser = Storage.get('user', null);
      if (currentUser) {
        currentUser.mustChangePassword = false;
        Storage.set('user', currentUser);
      }
    }
    return data;
  },

  // Google Firebase Authentication
  async loginWithGoogle() {
    // 1. Popup Google Authentication with Firebase client
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    if (!firebaseUser) throw new Error('Google authentication failed.');

    // 2. Obtain Firebase ID token
    const firebaseToken = await firebaseUser.getIdToken();

    // 3. Exchange with backend for ResourceHub JWT
    const data = await API.post('/api/auth/google', { firebaseToken });

    // 4. Store token and user
    if (data.token) Storage.set('token', data.token);
    if (data.user) Storage.set('user', data.user);
    return data;
  },

  // Logout
  async logout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signout warning:', err);
    }
    Storage.remove('token');
    Storage.remove('user');
  }
};
