import React from 'react';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
      {text && (
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          {text}
        </p>
      )}
    </div>
  );
}
