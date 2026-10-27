// ============================================
// CHANGEPASSWORDMODAL.JSX - Password Change Modal
// Covers Syllabus:
// - Point 32-33: Functional Components & Reusability
// - Point 34: Props & Parent-to-Child Communication (isOpen, onClose, isForced)
// - Point 35: useState for Form State (currentPassword, newPassword, confirm)
// - Point 37: Event Handling & Controlled Form Inputs
// - Point 46: Authentication UI & Password Validation
// ============================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ChangePasswordModal({ isOpen = true, onClose, isForced = false }) {
  const { changePassword, logout } = useAuth();
  const { success, error } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      error('Please enter your current password');
      return;
    }

    if (newPassword.length < 8) {
      error('New password must be at least 8 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      error('New password must be different from the current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('New password and confirmation do not match');
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose?.();
    } catch (err) {
      error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-scale-up">
        {/* Header Close button if voluntary */}
        {!isForced && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm">
            🔐
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isForced ? 'Action Required: Set New Password' : 'Change Password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isForced
              ? 'Your account was created with a temporary password. Please set a secure permanent password to continue.'
              : 'Update your security credentials with a strong, memorable password.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isForced ? 'Current / Temporary Password' : 'Current Password'}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            {!isForced && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60 active:scale-95"
            >
              {loading ? 'Updating Password...' : isForced ? 'Save & Continue' : 'Update Password'}
            </button>
          </div>
        </form>

        {isForced && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={logout}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Sign out instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
