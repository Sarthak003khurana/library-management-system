// ============================================
// TOASTCONTEXT.JSX - Global Toast Notifications System
// Covers Syllabus:
// - Point 32-33: Reusable UI Component
// - Point 35: useState for Toast Queue
// - Point 39: Side Effects / Timers for Dismissal
// - Point 43: Context API for Global Toast Triggering
// ============================================

import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
  const error = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
  const warning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);
  const info = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-700';
          let icon = 'ℹ️';

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20';
            icon = '✓';
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20';
            icon = '✕';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20';
            icon = '⚠️';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${bgClass}`}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs bg-black/15">
                  {icon}
                </span>
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 text-sm font-bold ml-2 p-1 focus:outline-none"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
