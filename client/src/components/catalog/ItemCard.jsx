// ============================================
// ITEMCARD.JSX - Tactile Catalog Resource Card
// Covers Syllabus:
// - Point 32-33: Functional Component & Reusability
// - Point 34: Props & Parent-to-Child Communication (onBorrow, onJoinWaitlist)
// - Point 38: Conditional Rendering based on type & availability
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../common/Badge.jsx';

export default function ItemCard({ item, onBorrow, onJoinWaitlist, loadingAction }) {
  const navigate = useNavigate();

  const isBook = item.type === 'book';
  const isAvailable = isBook
    ? (item.availableQuantity || 0) > 0
    : (item.status === 'available');
  const conditionRating = item.conditionRating || 10;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-[0_12px_30px_rgba(70,72,212,0.06)] hover:shadow-[0_20px_40px_rgba(70,72,212,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={isBook ? 'primary' : 'purple'} size="sm">
            {isBook ? '📚 Book' : '🔬 Equipment'}
          </Badge>

          <Badge variant={isAvailable ? 'success' : 'danger'} size="sm">
            {isBook
              ? (isAvailable ? `${item.availableQuantity} Available` : 'Out of Stock')
              : (isAvailable ? 'Available for Booking' : (item.status === 'maintenance' ? 'Maintenance' : 'In Use'))}
          </Badge>
        </div>

        {/* Thumbnail / Icon Cover */}
        <div
          onClick={() => navigate(`/catalog/${item.id}`)}
          className="w-full h-36 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/30 flex items-center justify-center text-4xl mb-4 overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-inner cursor-pointer"
          title="View resource details"
        >
          {item.coverUrl ? (
            <img
              src={item.coverUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span>{isBook ? '📖' : '⚡'}</span>
          )}
        </div>

        {/* Category & Title */}
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          {item.category || 'General'}
        </span>
        <h3
          onClick={() => navigate(`/catalog/${item.id}`)}
          className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2 leading-snug cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="View resource details"
        >
          {item.title}
        </h3>

        {item.author && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            by {item.author}
          </p>
        )}

        {/* Details snippet */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Location: <strong className="text-slate-700 dark:text-slate-300">{item.location || 'Main Lab'}</strong></span>
          <span>Condition: <strong className="text-emerald-600">{conditionRating}/10</strong></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5">
        {isBook ? (
          isAvailable ? (
            <button
              type="button"
              disabled={loadingAction}
              onClick={() => onBorrow(item.id)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-60"
            >
              Borrow Book
            </button>
          ) : (
            <button
              type="button"
              disabled={loadingAction}
              onClick={() => onJoinWaitlist(item.id)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-60"
            >
              Join Waitlist
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => navigate(`/timeline?itemId=${item.id}`)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            📅 Schedule in Timeline
          </button>
        )}
      </div>
    </div>
  );
}
