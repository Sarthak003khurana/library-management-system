import React from 'react';

export default function EmptyState({ icon = '📦', title = 'No items found', message = '', actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/70 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 rounded-3xl backdrop-blur-md my-6">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-3xl mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
        {title}
      </h3>
      {message && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {message}
        </p>
      )}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
