// ============================================
// CREATEUSERMODAL.JSX - Admin User Creation with Temporary Password
// Covers Syllabus:
// - Point 35: useState for User Credentials & Generated State
// - Point 37: Controlled Inputs & Validation
// - Point 44: Axios POST /api/auth/admin/create-user
// - Point 46: Role Assignment & Auth Workflow
// ============================================

import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { API } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  const [resending, setResending] = useState(false);

  const handleReset = () => {
    setName('');
    setEmail('');
    setRole('student');
    setCreatedResult(null);
    setResending(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      error('Please provide both full name and email');
      return;
    }

    setLoading(true);
    try {
      const data = await API.post('/api/auth/admin/create-user', {
        name: name.trim(),
        email: email.trim(),
        role,
      });

      if (data.emailSent) {
        success(`User "${name}" created and credentials dispatched!`);
      } else {
        error(`User created, but email dispatch failed: ${data.emailError || 'Email error'}`);
      }

      setCreatedResult(data);
      onSuccess?.();
    } catch (err) {
      error(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryEmail = async () => {
    if (!createdResult?.user?.id) return;
    setResending(true);
    try {
      const res = await API.post(`/api/auth/admin/resend-credentials/${createdResult.user.id}`);
      success(res.message || 'Credentials dispatched successfully!');
      setCreatedResult((prev) => ({
        ...prev,
        emailSent: true,
        emailError: null,
      }));
      onSuccess?.();
    } catch (err) {
      error(err.message || 'Failed to resend credentials');
    } finally {
      setResending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdResult ? 'User Account Provisioned' : 'Create New System User'}
      maxWidth="max-w-lg"
    >
      {createdResult ? (
        <div className="space-y-4">
          {createdResult.emailSent ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
              <p className="font-bold text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                <span>✓</span> Credentials Dispatched via Email
              </p>
              <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                A secure temporary password has been delivered to <strong>{createdResult.user?.email}</strong>. The user will be required to change it on their initial login.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
              <p className="font-bold text-amber-800 dark:text-amber-200 text-sm flex items-center gap-1.5">
                <span>⚠️</span> Account Created — Email Delivery Failed
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                The account was saved in the database, but credential email dispatch failed:
                <br />
                <span className="font-mono text-[11px] text-amber-900 dark:text-amber-200 mt-1 block">
                  {createdResult.emailError || 'Email provider configuration error.'}
                </span>
              </p>
              <button
                type="button"
                disabled={resending}
                onClick={handleRetryEmail}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {resending ? 'Retrying Dispatch...' : '🔄 Retry Email Delivery'}
              </button>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <strong className="text-slate-800 dark:text-slate-200">{createdResult.user?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <strong className="text-slate-800 dark:text-slate-200">{createdResult.user?.email}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Role:</span>
              <strong className="capitalize text-indigo-600 dark:text-indigo-400">{createdResult.user?.role}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security Requirement:</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Forced Password Reset on First Login</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              + Provision Another
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Institutional Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jsmith@university.edu"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Authorization Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty Member</option>
              <option value="lab_manager">Lab Manager</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <p className="text-[11px] text-slate-400">
            A secure temporary password will be auto-generated and dispatched to the user. They will be prompted to reset it on their initial sign-in.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-60"
            >
              {loading ? 'Creating Account...' : 'Generate &amp; Dispatch'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
