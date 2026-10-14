// ============================================
// ADMINDASHBOARDPAGE.JSX - Admin Analytics & KPI Metrics
// Covers Syllabus:
// - Point 31-33: Functional Components
// - Point 35: useState for Analytics Data & Canvas Refs
// - Point 39-40: useEffect with Chart.js Lifecycle Management & Cleanup (.destroy)
// - Point 44: Axios GET /api/analytics/overview
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';
import { API } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

export default function AdminDashboardPage() {
  const { error } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Canvas Refs
  const mostBorrowedCanvasRef = useRef(null);
  const categoryCanvasRef = useRef(null);
  const overdueCanvasRef = useRef(null);

  // Chart instances ref for cleanup
  const chartInstancesRef = useRef({});

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await API.get('/api/analytics/overview');
      setAnalytics(data);
    } catch (err) {
      error(err.message || 'Failed to load analytics overview');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Render Chart.js charts upon data availability
  useEffect(() => {
    if (!analytics || loading) return;

    // Destroy existing chart instances before re-creating
    Object.values(chartInstancesRef.current).forEach((chart) => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    chartInstancesRef.current = {};

    // 1. Most Borrowed Chart (Bar)
    if (mostBorrowedCanvasRef.current && analytics.mostBorrowed) {
      const labels = analytics.mostBorrowed.map((i) => i.title || 'Item');
      const counts = analytics.mostBorrowed.map((i) => i.count || 0);

      chartInstancesRef.current.mostBorrowed = new Chart(mostBorrowedCanvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Times Borrowed',
              data: counts,
              backgroundColor: '#4F46E5',
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        },
      });
    }

    // 2. Category Distribution Chart (Doughnut)
    if (categoryCanvasRef.current && analytics.categoryUsage) {
      const labels = Object.keys(analytics.categoryUsage);
      const values = Object.values(analytics.categoryUsage);

      chartInstancesRef.current.category = new Chart(categoryCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: [
                '#4F46E5',
                '#10B981',
                '#F59E0B',
                '#F43F5E',
                '#0EA5E9',
                '#8B5CF6',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    }

    // 3. Overdue Trend Chart (Line)
    if (overdueCanvasRef.current && analytics.overdueTrend) {
      const labels = analytics.overdueTrend.map((t) => t.week || 'Week');
      const dataPoints = analytics.overdueTrend.map((t) => t.overdue || 0);

      chartInstancesRef.current.overdue = new Chart(overdueCanvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Overdue Items',
              data: dataPoints,
              borderColor: '#F43F5E',
              backgroundColor: 'rgba(244,63,94,0.1)',
              fill: true,
              tension: 0.35,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        },
      });
    }

    // Cleanup function: destroy charts on unmount or refresh (Point 39 cleanup)
    return () => {
      Object.values(chartInstancesRef.current).forEach((chart) => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
      chartInstancesRef.current = {};
    };
  }, [analytics, loading]);

  if (loading) {
    return <LoadingSpinner text="Computing library & lab metrics..." />;
  }

  const kpis = [
    { label: 'Total Catalog Items', value: analytics?.totalItems ?? 0, icon: '📦', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Active Loans', value: analytics?.activeLoans ?? 0, icon: '📖', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Overdue Penalties', value: analytics?.overdueCount ?? 0, icon: '⚠️', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40' },
    { label: 'Fines Collected', value: `$${(analytics?.finesCollected ?? 0).toFixed(2)}`, icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          System Analytics &amp; Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          High-level operational overview, resource turnover, and penalty metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {kpi.label}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
                {kpi.value}
              </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${kpi.bg} ${kpi.color}`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Borrowed Resources */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            Top Borrowed Resources
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Most requested titles and lab equipment across all departments
          </p>
          <div className="h-64 flex items-center justify-center">
            <canvas ref={mostBorrowedCanvasRef} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            Category Utilization
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Distribution of resources across categories
          </p>
          <div className="h-64 flex items-center justify-center">
            <canvas ref={categoryCanvasRef} />
          </div>
        </div>

        {/* Overdue Items Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            Overdue Incident Trends
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Weekly count of items kept past their scheduled return date
          </p>
          <div className="h-64 flex items-center justify-center">
            <canvas ref={overdueCanvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
