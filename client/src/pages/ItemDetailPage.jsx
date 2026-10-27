// ============================================
// ITEMDETAILPAGE.JSX - Resource Detail View with useParams()
// Covers Syllabus:
// - Point 45: Props & Component Hierarchy
// - Point 46-47: useState for Resource Data & Action Loading
// - Point 50-51: useEffect with Dependency Array for Dynamic Route Lookup
// - Point 52-53: React Router Route Parameters (useParams) & Navigation
// - Point 55: Axios API Integration with Error & Loading States
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Badge from '../components/common/Badge.jsx';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadItemDetail() {
      if (!id) return;
      try {
        setLoading(true);
        setNotFound(false);
        const data = await API.get(`/api/items/${id}`);
        if (isMounted) {
          setItem(data);
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404 || err.message?.toLowerCase().includes('not found')) {
            setNotFound(true);
          } else {
            error(err.message || 'Failed to load resource details');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadItemDetail();

    return () => {
      isMounted = false;
    };
  }, [id, error]);

  const handleBorrow = async () => {
    if (!item) return;
    setActionLoading(true);
    try {
      await API.post('/api/reservations', { itemId: item.id });
      success(`Book "${item.title}" borrowed successfully!`);
      // Refresh item state
      const refreshed = await API.get(`/api/items/${item.id}`);
      setItem(refreshed);
    } catch (err) {
      error(err.message || 'Failed to borrow book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!item) return;
    setActionLoading(true);
    try {
      await API.post('/api/waitlist', { itemId: item.id, urgency: 'normal' });
      success('You have been added to the priority waitlist!');
    } catch (err) {
      error(err.message || 'Failed to join waitlist');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading resource details..." />;
  }

  if (notFound || !item) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          ← Back to Catalog
        </button>
        <EmptyState
          icon="🔍"
          title="Resource Not Found"
          message={`No library book or equipment found matching ID "${id}".`}
          actionText="Browse Available Catalog"
          onAction={() => navigate('/catalog')}
        />
      </div>
    );
  }

  const isBook = item.type === 'book';
  const isAvailable = isBook
    ? (item.availableQuantity || 0) > 0
    : item.status === 'available';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 transition-colors"
        >
          ← Back to Catalog
        </button>
        <div className="text-[11px] font-mono text-slate-400">
          ID: {item.id}
        </div>
      </div>

      {/* Main Detail Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-[0_20px_50px_rgba(70,72,212,0.08)]">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover / Icon Visual */}
          <div className="w-full md:w-64 h-64 sm:h-72 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/40 flex items-center justify-center text-6xl shadow-inner border border-slate-100 dark:border-slate-800/80 flex-shrink-0 overflow-hidden">
            {item.coverUrl ? (
              <img
                src={item.coverUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span>{isBook ? '📚' : '🔬'}</span>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={isBook ? 'primary' : 'purple'} size="sm">
                  {isBook ? '📚 Book' : '🔬 Lab Equipment'}
                </Badge>
                <Badge variant={isAvailable ? 'success' : 'danger'} size="sm">
                  {isBook
                    ? (isAvailable ? `${item.availableQuantity} Available` : 'Out of Stock')
                    : (isAvailable ? 'Available for Booking' : (item.status === 'maintenance' ? 'Maintenance' : 'In Use'))}
                </Badge>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider ml-1">
                  {item.category || 'General'}
                </span>
              </div>

              {/* Title & Author */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {item.title}
              </h1>

              {item.author && (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  by <span className="text-slate-700 dark:text-slate-200">{item.author}</span>
                </p>
              )}

              {/* Specification Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Location
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {item.location || 'Main Storage'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Condition Rating
                  </span>
                  <span className="font-semibold text-emerald-600 mt-0.5 block">
                    {item.conditionRating || 10} / 10
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Late Fee Rate
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    ${item.finePerDay || (isBook ? 3 : 10)} / day
                  </span>
                </div>

                {isBook && item.isbn && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      ISBN
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block">
                      {item.isbn}
                    </span>
                  </div>
                )}

                {isBook && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Total Copies
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {item.quantity || 1} copies
                    </span>
                  </div>
                )}

                {isBook && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Available Copies
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                      {item.availableQuantity ?? (item.quantity || 1)} copies
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
              {isBook ? (
                isAvailable ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleBorrow}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {actionLoading ? 'Processing Loan...' : '📖 Borrow for 14 Days'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleJoinWaitlist}
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {actionLoading ? 'Joining...' : '⏳ Join Priority Waitlist'}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/timeline?itemId=${item.id}`)}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-lg transition-all active:scale-95"
                >
                  📅 View &amp; Book in Timeline
                </button>
              )}

              <Link
                to="/catalog"
                className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Catalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
