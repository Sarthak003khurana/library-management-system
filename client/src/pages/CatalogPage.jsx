// ============================================
// CATALOGPAGE.JSX - Browse & Borrow Catalog
// Covers Syllabus:
// - Point 31: React Fundamentals
// - Point 35: useState for Search, Filter & Items
// - Point 37: Event Handling & Controlled Filter Inputs
// - Point 38: Conditional Rendering, Lists & Keys
// - Point 39-40: useEffect with Cleanup for Keyboard Shortcuts
// - Point 44: Axios GET /api/items & POST /api/reservations
// ============================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { API } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import ItemCard from '../components/catalog/ItemCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

export default function CatalogPage() {
  const { success, error } = useToast();
  const searchInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await API.get('/api/items');
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      error(err.message || 'Failed to load catalog resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Keyboard shortcut: '/' focuses search input (Point 39 cleanup)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unique categories list
  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      // Category
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      // Availability
      if (availabilityFilter === 'available' && (item.availableQuantity || 0) <= 0) return false;
      if (availabilityFilter === 'unavailable' && (item.availableQuantity || 0) > 0) return false;
      // Search term
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesAuthor = item.author?.toLowerCase().includes(query);
        const matchesCat = item.category?.toLowerCase().includes(query);
        const matchesIsbn = item.isbn?.toLowerCase().includes(query);
        return matchesTitle || matchesAuthor || matchesCat || matchesIsbn;
      }
      return true;
    });
  }, [items, typeFilter, categoryFilter, availabilityFilter, search]);

  const handleBorrowBook = async (itemId) => {
    setActionLoadingId(itemId);
    try {
      await API.post('/api/reservations', { itemId });
      success('Book borrowed successfully! Check your dashboard for return dates.');
      fetchItems();
    } catch (err) {
      error(err.message || 'Failed to borrow book');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleJoinWaitlist = async (itemId) => {
    setActionLoadingId(itemId);
    try {
      await API.post('/api/waitlist', { itemId, urgency: 'normal' });
      success('You have been added to the priority waitlist!');
      fetchItems();
    } catch (err) {
      error(err.message || 'Failed to join waitlist');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Resource Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search and check out books or view laboratory equipment schedule.
          </p>
        </div>
        <div className="text-xs font-semibold px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 self-start sm:self-auto border border-indigo-100 dark:border-indigo-900">
          Showing {filteredItems.length} of {items.length} resources
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, category, ISBN... (Press '/' to focus)"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="book">📚 Books Only</option>
            <option value="equipment">🔬 Equipment Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Any Availability</option>
            <option value="available">In Stock Now</option>
            <option value="unavailable">Waitlist / Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <LoadingSpinner text="Searching resources..." />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No resources match your filters"
          message="Try adjusting your keywords, type filter, or clearing search criteria."
          actionText="Reset All Filters"
          onAction={() => {
            setSearch('');
            setTypeFilter('all');
            setCategoryFilter('all');
            setAvailabilityFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onBorrow={handleBorrowBook}
              onJoinWaitlist={handleJoinWaitlist}
              loadingAction={actionLoadingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
