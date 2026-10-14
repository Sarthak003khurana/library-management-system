// ============================================
// ADMINUSERSPAGE.JSX - Admin User Accounts Management
// Covers Syllabus:
// - Point 31-33: Functional Components & Table View
// - Point 35: useState for User Directory & Modal State
// - Point 37: Event Handling & Search Filtering
// - Point 44: Axios GET /api/auth/users & DELETE /api/auth/users/:id
// - Point 46: Role-Based Access Badges
// ============================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Badge from '../../components/common/Badge.jsx';
import CreateUserModal from '../../components/admin/CreateUserModal.jsx';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await API.get('/api/auth/users');
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (err) {
      error(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [users, roleFilter, search]);

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      error('You cannot delete your own active administrator account');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${user.name}" (${user.email})?`)) {
      return;
    }

    setDeletingId(user.id);
    try {
      await API.delete(`/api/auth/users/${encodeURIComponent(user.id)}`);
      success(`Deleted user "${user.name}" successfully`);
      fetchUsers();
    } catch (err) {
      error(err.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'lab_manager':
        return 'warning';
      case 'faculty':
        return 'purple';
      default:
        return 'primary';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            User Accounts &amp; Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provision user accounts, assign role permissions, and review password change compliance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-95 self-start sm:self-auto"
        >
          + Provision User
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email address..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="lab_manager">Lab Manager</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      {/* User Table */}
      {loading ? (
        <LoadingSpinner text="Fetching registered user directory..." />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users match filters"
          message="No user profiles correspond to the active filter criteria."
          actionText="+ Provision User"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">User Profile</th>
                  <th className="py-4 px-6">System Role</th>
                  <th className="py-4 px-6">Password Status</th>
                  <th className="py-4 px-6">Account ID</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const initials = (u.name || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {(u.role || 'student').replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>

                      <td className="py-4 px-6">
                        {u.mustChangePassword ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <span>⏳</span> Temporary
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span>✓</span> Verified
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-mono text-slate-400 text-[11px]">
                        {u.id?.substring(0, 10)}...
                      </td>

                      <td className="py-4 px-6 text-right">
                        {!isCurrent && (
                          <button
                            type="button"
                            disabled={deletingId === u.id}
                            onClick={() => handleDelete(u)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 font-semibold text-xs transition-colors disabled:opacity-50"
                          >
                            {deletingId === u.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
