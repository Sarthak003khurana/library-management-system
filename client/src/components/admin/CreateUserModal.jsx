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

  const handleReset = () => {
    setName('');
    setEmail('');
    setRole('student');
    setCreatedResult(null);
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

      success(`Created user "${name}" successfully!`);
      setCreatedResult(data);
      onSuccess?.();
    } catch (err) {
      error(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdResult ? 'User Created Successfully' : 'Create New System User'}
      maxWidth="max-w-lg"
    >
      {createdResult ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <p className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">
              ✓ Account created and registered
            </p>
            <p className="text-emerald-700 dark:text-emerald-300 mt-1">
              An invitation email has been dispatched with login credentials.
            </p>
          </div>

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
            {createdResult.temporaryPassword && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-400">Temporary Password:</span>
                <span className="font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg">
                  {createdResult.temporaryPassword}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
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
