// ============================================
// TIMELINEPAGE.JSX - 14-Day Visual Equipment Scheduler
// Covers Syllabus:
// - Point 31-33: Functional Components & Grid Layout
// - Point 35: useState for Calendar Days, Selection, Equipment
// - Point 38: List Rendering (.map) with Matrix Keys
// - Point 41-42: React Router Route Parameters / Query Params (useSearchParams)
// - Point 44: Axios GET /api/items & /api/reservations
// ============================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import BookingModal from '../components/timeline/BookingModal.jsx';

export default function TimelinePage() {
  const { user } = useAuth();
  const { error } = useToast();
  const [searchParams] = useSearchParams();
  const targetItemId = searchParams.get('itemId');

  const [equipment, setEquipment] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate 14 days starting from today
  const days = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [equipData, resData] = await Promise.all([
        API.get('/api/items?type=equipment'),
        API.get('/api/reservations?all=true').catch(() => API.get('/api/reservations'))
      ]);

      setEquipment(Array.isArray(equipData) ? equipData : equipData?.items || []);
      setReservations(Array.isArray(resData) ? resData : resData?.reservations || []);
    } catch (err) {
      error(err.message || 'Failed to load timeline schedule');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute status for an item on a particular day
  const getDayStatus = (item, day) => {
    const dayTime = day.getTime();

    // Check existing reservations for this item
    const matchingRes = reservations.filter((r) => {
      if (r.itemId !== item.id) return false;
      if (r.status === 'cancelled' || r.status === 'returned') return false;

      const start = new Date(r.startDate || r.createdAt);
      start.setHours(0, 0, 0, 0);

      const end = new Date(r.endDate || r.dueDate || r.startDate || r.createdAt);
      end.setHours(23, 59, 59, 999);

      return dayTime >= start.getTime() && dayTime <= end.getTime();
    });

    if (matchingRes.length > 0) {
      const isMine = matchingRes.some((r) => r.userId === user?.id);
      return isMine ? 'mine' : 'booked';
    }

    return 'available';
  };

  const handleCellClick = (item, day, status) => {
    if (status !== 'available') return;
    setSelectedItem(item);
    setSelectedDate(day);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Legend */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Equipment Booking Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual 14-day equipment schedule. Click any available green slot to book.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/20 border border-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 border border-indigo-700" />
            <span className="text-slate-600 dark:text-slate-300">Your Booking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-500/20 border border-rose-500" />
            <span className="text-slate-600 dark:text-slate-300">Reserved</span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading equipment timeline..." />
      ) : equipment.length === 0 ? (
        <EmptyState
          icon="🔬"
          title="No laboratory equipment found"
          message="There is no equipment registered in the system currently."
        />
      ) : (
        /* Timeline Table Container */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                  <th className="py-4 px-5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-850 z-10 w-64 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    Equipment / Device
                  </th>
                  {days.map((d, index) => {
                    const isToday = index === 0;
                    return (
                      <th
                        key={d.toISOString()}
                        className={`py-3 px-2 text-center text-[11px] font-bold min-w-[58px] ${
                          isToday ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="capitalize">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-sm font-black mt-0.5">{d.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {equipment.map((item) => {
                  const isHighlighted = targetItemId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-850/60 transition-colors ${
                        isHighlighted ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Equipment Name / Sticky Left Column */}
                      <td className="py-4 px-5 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">🔬</span>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {item.category || 'Equipment'} • {item.location || 'Lab'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 14 Day Slot Cells */}
                      {days.map((day) => {
                        const status = getDayStatus(item, day);

                        let cellClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 cursor-pointer border border-emerald-500/30';
                        let label = '✓';

                        if (status === 'mine') {
                          cellClass = 'bg-indigo-600 text-white font-bold border border-indigo-700 shadow-sm';
                          label = 'YOU';
                        } else if (status === 'booked') {
                          cellClass = 'bg-rose-500/15 text-rose-600 border border-rose-500/30 cursor-not-allowed';
                          label = 'OCC';
                        }

                        return (
                          <td key={day.toISOString()} className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleCellClick(item, day, status)}
                              disabled={status !== 'available'}
                              title={`${item.title} on ${day.toDateString()} (${status})`}
                              className={`w-full h-10 rounded-xl flex items-center justify-center text-[10px] font-bold transition-transform active:scale-90 ${cellClass}`}
                            >
                              {label}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        initialDate={selectedDate}
        onSuccess={fetchData}
      />
    </div>
  );
}
