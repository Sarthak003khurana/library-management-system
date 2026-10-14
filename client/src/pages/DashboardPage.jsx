// ============================================
// DASHBOARDPAGE.JSX - Personal User Dashboard
// Covers Syllabus:
// - Point 31-33: Functional Components & Reusability
// - Point 35: useState for Dashboard Data & Modal State
// - Point 38: Conditional Rendering, Lists & Keys (.map)
// - Point 39-40: useEffect for Data Fetching & Dependency Management
// - Point 44: Centralized Axios API Calls
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Badge from '../components/common/Badge.jsx';
import ReturnModal from '../components/dashboard/ReturnModal.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [fines, setFines] = useState([]);
  const [waitlist, setWaitlist] = useState([]);

  // Return modal state
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [resData, finesData, waitlistData] = await Promise.all([
        API.get('/api/reservations'),
        API.get('/api/fines').catch(() => []),
        API.get('/api/waitlist').catch(() => [])
      ]);

      setReservations(Array.isArray(resData) ? resData : resData?.reservations || []);
      setFines(Array.isArray(finesData) ? finesData : finesData?.fines || []);
      setWaitlist(Array.isArray(waitlistData) ? waitlistData : waitlistData?.waitlist || []);
    } catch (err) {
      error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics
  const activeBorrows = reservations.filter(
    (r) => r.status === 'borrowed' || r.status === 'active'
  );
  const overdueCount = activeBorrows.filter(
    (r) => r.dueDate && new Date(r.dueDate) < new Date()
  ).length;
  const unpaidFinesTotal = fines
    .filter((f) => f.status === 'unpaid')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const handleOpenReturn = (reservation) => {
    setSelectedReservation(reservation);
    setIsReturnModalOpen(true);
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-indigo-300">
            Welcome Back
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            {user?.name || 'Scholar'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
            Manage your active equipment reservations, library books, and return schedules in one tactile dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/catalog"
            className="px-5 py-2.5 rounded-2xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 shadow-md transition-all active:scale-95"
          >
            📚 Browse Catalog
          </Link>
          <Link
            to="/timeline"
            className="px-5 py-2.5 rounded-2xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-bold text-xs border border-indigo-500/30 transition-all active:scale-95"
          >
            📅 Book Lab Slot
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Loans */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-[0_10px_30px_rgba(70,72,212,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Borrows
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
              📖
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-3">
            {activeBorrows.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Currently in your possession</p>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-[0_10px_30px_rgba(70,72,212,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Overdue Items
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg">
              ⚠️
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-3">
            {overdueCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Immediate return requested</p>
        </div>

        {/* Waitlist Position */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-[0_10px_30px_rgba(70,72,212,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Waitlist Queues
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              ⏳
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-3">
            {waitlist.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Queued for availability</p>
        </div>

        {/* Unpaid Fines */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-[0_10px_30px_rgba(70,72,212,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Outstanding Fines
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              💰
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-3">
            ${unpaidFinesTotal.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {unpaidFinesTotal > 0 ? (
              <Link to="/fines" className="text-indigo-600 hover:underline font-semibold">
                Pay online &rarr;
              </Link>
            ) : (
              'All dues settled'
            )}
          </p>
        </div>
      </div>

      {/* Active Borrowed Items Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Currently Checked Out
            </h2>
            <p className="text-xs text-slate-400">
              Items currently assigned to your account. Return on or before due date.
            </p>
          </div>
          <Badge variant="primary">{activeBorrows.length} Active</Badge>
        </div>

        {activeBorrows.length === 0 ? (
          <EmptyState
            icon="📖"
            title="No active items checked out"
            message="You do not have any borrowed equipment or books at the moment."
            actionText="Explore Library & Lab Items"
            onAction={() => navigate('/catalog')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBorrows.map((res) => {
              const isOverdue = res.dueDate && new Date(res.dueDate) < new Date();
              return (
                <div
                  key={res.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl">
                        {res.itemType === 'equipment' ? '🔬' : '📚'}
                      </span>
                      <Badge variant={isOverdue ? 'danger' : 'success'}>
                        {isOverdue ? 'OVERDUE' : 'ACTIVE LOAN'}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-3 line-clamp-1">
                      {res.itemTitle || 'Resource'}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">
                      Type: {res.itemType || 'Resource'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Due Date</span>
                        <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {res.dueDate ? new Date(res.dueDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fine Rate</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          ${res.finePerDay || 3}/day
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReturn(res)}
                    className="mt-5 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                  >
                    Return Resource
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return Modal Dialog */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        reservation={selectedReservation}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
