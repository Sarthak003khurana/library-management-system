// ============================================
// RETURNMODAL.JSX - Item Return & Condition Assessment
// Covers Syllabus:
// - Point 35: useState for Condition Rating & Damage Notes
// - Point 37: Event Handling
// - Point 44: Axios POST to /api/reservations/:id/return
// ============================================

import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { API } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ReturnModal({ isOpen, onClose, reservation, onSuccess }) {
  const { success, error } = useToast();
  const [conditionRating, setConditionRating] = useState(10);
  const [damageDescription, setDamageDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!reservation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post(`/api/reservations/${reservation.id}/return`, {
        conditionRating: Number(conditionRating),
        damageDescription: conditionRating < 7 ? damageDescription : ''
      });

      success(`Successfully returned "${reservation.itemTitle || 'Item'}"!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to process item return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Return Item & Condition Assessment">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {reservation.itemTitle || 'Resource'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Reservation ID: <span className="font-mono">{reservation.id?.substring(0, 8)}...</span>
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Condition Rating (1-10)
            </label>
            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              {conditionRating} / 10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={conditionRating}
            onChange={(e) => setConditionRating(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1 - Damaged</span>
            <span>5 - Normal Wear</span>
            <span>10 - Like New</span>
          </div>
        </div>

        {conditionRating < 8 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Damage / Wear Description
            </label>
            <textarea
              rows="3"
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              placeholder="Describe any scratches, missing parts, or functional defects..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

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
            {loading ? 'Processing...' : 'Confirm Return'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
