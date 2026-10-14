// ============================================
// FINESPAGE.JSX - Fines & Penalties Settlement
// Covers Syllabus:
// - Point 31-33: Functional Components
// - Point 35: useState for Fine List & Payment State
// - Point 38: Conditional Rendering of Unpaid vs Settled Dues
// - Point 44: Axios GET /api/fines & POST /api/fines/:id/pay
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Badge from '../components/common/Badge.jsx';

export default function FinesPage() {
  const { success, error } = useToast();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const fetchFines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await API.get('/api/fines');
      setFines(Array.isArray(data) ? data : data?.fines || []);
    } catch (err) {
      error(err.message || 'Failed to fetch account fines');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const unpaidTotal = fines
    .filter((f) => f.status === 'unpaid')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const handlePayFine = async (fineId) => {
    setPayingId(fineId);
    try {
      await API.post(`/api/fines/${fineId}/pay`);
      success('Fine payment confirmed! Dues updated.');
      fetchFines();
    } catch (err) {
      error(err.message || 'Failed to complete fine payment');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Total Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Fines &amp; Overdue Penalties
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review fine assessments accrued from late returns or damage appraisals.
          </p>
        </div>

        {/* Total Outstanding Card */}
        <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 self-start sm:self-auto">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Outstanding
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ${unpaidTotal.toFixed(2)}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${
            unpaidTotal > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
          }`}>
            {unpaidTotal > 0 ? '⚠️' : '✓'}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Checking account balances..." />
      ) : fines.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="No fines on your account"
          message="Your account is completely clear of any overdue penalties or damage assessments."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">Reason / Item</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Date Assessed</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fines.map((fine) => {
                  const isUnpaid = fine.status === 'unpaid';
                  return (
                    <tr key={fine.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span>💰</span>
                          <div>
                            <div>{fine.reason || fine.itemTitle || 'Overdue item fine'}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Reference: {fine.id?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        ${Number(fine.amount || 0).toFixed(2)}
                      </td>

                      <td className="py-4 px-6 text-slate-500">
                        {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-6">
                        <Badge variant={isUnpaid ? 'danger' : 'success'}>
                          {fine.status ? fine.status.toUpperCase() : 'PAID'}
                        </Badge>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {isUnpaid ? (
                          <button
                            type="button"
                            disabled={payingId === fine.id}
                            onClick={() => handlePayFine(fine.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {payingId === fine.id ? 'Processing...' : 'Pay Online'}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            ✓ Settled
                          </span>
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
    </div>
  );
}
