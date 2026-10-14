// ============================================
// BOOKINGMODAL.JSX - Equipment Slot Reservation Modal
// Covers Syllabus:
// - Point 35: useState for Start/End Date Range Selection
// - Point 37: Controlled Forms & Date Validation
// - Point 44: Axios POST to /api/reservations
// ============================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { API } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function BookingModal({ isOpen, onClose, item, initialDate, onSuccess }) {
  const { success, error } = useToast();

  const formatDateString = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    return dateObj.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDate) {
      const formatted = formatDateString(initialDate);
      setStartDate(formatted);
      // Default to 1-day or same-day slot
      setEndDate(formatted);
    }
  }, [initialDate, isOpen]);

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      error('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      error('Start date cannot be after end date');
      return;
    }

    setLoading(true);
    try {
      await API.post('/api/reservations', {
        itemId: item.id,
        startDate,
        endDate
      });

      success(`Successfully booked ${item.title}!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to complete equipment booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Lab Equipment">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔬</span>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {item.title}
              </h4>
              <p className="text-xs text-slate-500 capitalize">
                Category: {item.category || 'Laboratory'} | Location: {item.location || 'Lab 2B'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              min={formatDateString(new Date())}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || formatDateString(new Date())}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300">
          ℹ️ Equipment is reserved on a per-day schedule. Late returns are charged at <strong>${item.finePerDay || 10}/day</strong>.
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-60"
          >
            {loading ? 'Booking...' : 'Confirm Reservation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
