// ============================================
// ADMINITEMSPAGE.JSX - Admin Resource & Equipment CRUD
// Covers Syllabus:
// - Point 31-33: Functional Components & Table View
// - Point 35: useState for Item List, Search, Modal Visibility
// - Point 37: Event Handling & Form Control
// - Point 38: List Rendering & Conditional Status Badges
// - Point 44: Axios GET, POST, PUT, DELETE /api/items
// ============================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Badge from '../../components/common/Badge.jsx';
import ItemFormModal from '../../components/admin/ItemFormModal.jsx';
import BulkImportModal from '../../components/admin/BulkImportModal.jsx';

export default function AdminItemsPage() {
  const { success, error } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await API.get('/api/items');
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      error(err.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          item.title?.toLowerCase().includes(query) ||
          item.author?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.isbn?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [items, typeFilter, search]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      await API.delete(`/api/items/${item.id}`);
      success(`Deleted "${item.title}" successfully`);
      fetchItems();
    } catch (err) {
      error(err.message || 'Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory &amp; Resource Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, update stock, audit condition, and perform bulk batch imports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBulkModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            📂 Bulk Import
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
          >
            + Add Resource
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title, author, category, or ISBN..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="book">Books</option>
          <option value="equipment">Equipment</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading inventory records..." />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No resources found"
          message="No items match your criteria. Add a new resource or clear filters."
          actionText="+ Add Resource"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">Resource Info</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Available / Total</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Condition</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => {
                  const avail = item.availableQuantity ?? 0;
                  const total = item.quantity ?? 1;
                  const isOutOfStock = avail <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100 max-w-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.type === 'equipment' ? '🔬' : '📚'}</span>
                          <div>
                            <div className="line-clamp-1">{item.title}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {item.author ? `by ${item.author}` : `Type: ${item.type}`}
                              {item.isbn ? ` • ISBN: ${item.isbn}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <Badge variant="primary" size="sm">
                          {item.category || 'General'}
                        </Badge>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`font-extrabold ${isOutOfStock ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                          {avail} / {total}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {isOutOfStock ? 'Depleted' : 'In stock'}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        {item.location || 'Unassigned'}
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {item.conditionRating || 10}/10
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 font-semibold text-xs transition-colors disabled:opacity-50"
                          >
                            {deletingId === item.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <ItemFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        item={editingItem}
        onSuccess={fetchItems}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={fetchItems}
      />
    </div>
  );
}
