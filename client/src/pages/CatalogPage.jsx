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
import { SessionStorage } from '../utils/storage.js';
import ItemCard from '../components/catalog/ItemCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

export default function CatalogPage() {
  const { success, error, info } = useToast();
  const searchInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters initialized from SessionStorage (Syllabus Point 29-30 & Lab 3)
  const [search, setSearch] = useState(() => SessionStorage.get('rh_catalog_search', ''));
  const [typeFilter, setTypeFilter] = useState(() => SessionStorage.get('rh_catalog_type', 'all'));
  const [categoryFilter, setCategoryFilter] = useState(() => SessionStorage.get('rh_catalog_category', 'all'));
  const [availabilityFilter, setAvailabilityFilter] = useState(() => SessionStorage.get('rh_catalog_avail', 'all'));

  // Sync filter changes to SessionStorage
  useEffect(() => {
    SessionStorage.set('rh_catalog_search', search);
  }, [search]);

  useEffect(() => {
    SessionStorage.set('rh_catalog_type', typeFilter);
  }, [typeFilter]);

  useEffect(() => {
    SessionStorage.set('rh_catalog_category', categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    SessionStorage.set('rh_catalog_avail', availabilityFilter);
  }, [availabilityFilter]);

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
      const isItemAvailable = item.type === 'book'
        ? (item.availableQuantity || 0) > 0
        : (item.status === 'available');
      if (availabilityFilter === 'available' && !isItemAvailable) return false;
      if (availabilityFilter === 'unavailable' && isItemAvailable) return false;
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

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      info('Streaming catalog CSV export via Node.js streams...');
      const response = await API.client.get('/api/items/export/csv', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resourcehub-catalog-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      success('Catalog CSV exported successfully via Node.js stream!');
    } catch (err) {
      error(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
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
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            disabled={exporting}
            onClick={handleExportCsv}
            className="text-xs font-semibold px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm disabled:opacity-50"
            title="Download full catalog using Node.js streaming pipeline"
          >
            {exporting ? 'Streaming...' : '📥 Export CSV (Stream)'}
          </button>
          <div className="text-xs font-semibold px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
            Showing {filteredItems.length} of {items.length} resources
          </div>
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
