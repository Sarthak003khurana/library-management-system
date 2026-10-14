// ============================================
// WAITLISTPAGE.JSX - Priority Waitlist Management
// Covers Syllabus:
// - Point 31-33: Functional Components & Table View
// - Point 35: useState for Waitlist Items & Cancel Action Loading
// - Point 38: List Rendering & Empty State
// - Point 44: Axios GET /api/waitlist & DELETE /api/waitlist/:id
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Badge from '../components/common/Badge.jsx';

export default function WaitlistPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchWaitlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await API.get('/api/waitlist');
      setWaitlist(Array.isArray(data) ? data : data?.waitlist || []);
    } catch (err) {
      error(err.message || 'Failed to load waitlist entries');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to leave this waitlist queue?')) return;
    setCancellingId(id);
    try {
      await API.delete(`/api/waitlist/${id}`);
      success('Left waitlist queue successfully');
      fetchWaitlist();
    } catch (err) {
      error(err.message || 'Failed to leave waitlist');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Priority Waitlist
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor your position for high-demand resources. You will be notified automatically when an item becomes available.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching waitlist status..." />
      ) : waitlist.length === 0 ? (
        <EmptyState
          icon="⏳"
          title="No waitlist reservations"
          message="You are not waiting in line for any resources right now."
          actionText="Browse Available Catalog"
          onAction={() => navigate('/catalog')}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">Resource</th>
                  <th className="py-4 px-6">Queue Position</th>
                  <th className="py-4 px-6">Priority Level</th>
                  <th className="py-4 px-6">Date Requested</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {waitlist.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📚</span>
                        <div>
                          <div>{entry.itemTitle || entry.itemId}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Queue ID: {entry.id?.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-extrabold text-xs">
                        #{entry.position || index + 1} in queue
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant={entry.urgency === 'high' ? 'danger' : 'primary'}>
                        {entry.urgency ? entry.urgency.toUpperCase() : 'NORMAL'}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Recently'}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        disabled={cancellingId === entry.id}
                        onClick={() => handleCancel(entry.id)}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold text-xs transition-colors disabled:opacity-50"
                      >
                        {cancellingId === entry.id ? 'Leaving...' : 'Cancel Waitlist'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
