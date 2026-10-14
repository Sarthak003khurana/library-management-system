// ============================================
// ITEMFORMMODAL.JSX - Add & Edit Item Dialog with ISBN Autofill
// Covers Syllabus:
// - Point 34: Props & Callbacks (item, onSuccess)
// - Point 35: useState for Form State
// - Point 37: Controlled Inputs & ISBN Auto-Lookup API integration
// - Point 44: Axios POST /api/items & PUT /api/items/:id & GET /api/items/lookup/isbn/:isbn
// ============================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { API } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ItemFormModal({ isOpen, onClose, item, onSuccess }) {
  const { success, error, info } = useToast();
  const isEditing = Boolean(item?.id);

  const [formData, setFormData] = useState({
    title: '',
    type: 'book',
    category: 'Computer Science',
    quantity: 1,
    location: 'Main Shelf A',
    finePerDay: 3,
    conditionRating: 10,
    isbn: '',
    author: '',
    coverUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [lookingUpIsbn, setLookingUpIsbn] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        type: item.type || 'book',
        category: item.category || 'Computer Science',
        quantity: item.quantity || 1,
        location: item.location || 'Main Shelf A',
        finePerDay: item.finePerDay || (item.type === 'equipment' ? 10 : 3),
        conditionRating: item.conditionRating || 10,
        isbn: item.isbn || '',
        author: item.author || '',
        coverUrl: item.coverUrl || '',
      });
    } else {
      setFormData({
        title: '',
        type: 'book',
        category: 'Computer Science',
        quantity: 1,
        location: 'Main Shelf A',
        finePerDay: 3,
        conditionRating: 10,
        isbn: '',
        author: '',
        coverUrl: '',
      });
    }
  }, [item, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleIsbnLookup = async () => {
    if (!formData.isbn.trim()) {
      error('Please enter an ISBN number first');
      return;
    }
    setLookingUpIsbn(true);
    try {
      info('Looking up book metadata via OpenLibrary...');
      const cleanIsbn = formData.isbn.trim().replace(/[^0-9X]/gi, '');
      const data = await API.get(`/api/items/lookup/isbn/${cleanIsbn}`);

      if (data) {
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title,
          author: data.author || prev.author,
          coverUrl: data.coverUrl || prev.coverUrl,
          category: data.category || prev.category,
        }));
        success('Autofilled book details from ISBN registry!');
      }
    } catch (err) {
      error(err.message || 'Book details not found for this ISBN');
    } finally {
      setLookingUpIsbn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      error('Title is required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await API.put(`/api/items/${item.id}`, formData);
        success(`Updated "${formData.title}" successfully!`);
      } else {
        await API.post('/api/items', formData);
        success(`Created "${formData.title}" successfully!`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Catalog Resource' : 'Add New Resource'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type & ISBN row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resource Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  type: newType,
                  finePerDay: newType === 'equipment' ? 10 : 3,
                }));
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="book">📚 Library Book</option>
              <option value="equipment">🔬 Lab Equipment</option>
            </select>
          </div>

          {formData.type === 'book' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ISBN Lookup
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="e.g. 9780132350884"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleIsbnLookup}
                  disabled={lookingUpIsbn}
                  className="px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors whitespace-nowrap"
                >
                  {lookingUpIsbn ? '...' : '🔍 Fetch'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Resource Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Clean Code: A Handbook of Agile Software Craftsmanship"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Author & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Author / Manufacturer
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="e.g. Robert C. Martin"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g. Computer Science, Physics Lab"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Quantity, Location & Fine */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Quantity
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Physical Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Shelf 4B / Lab Room 102"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fine Rate ($/day)
            </label>
            <input
              type="number"
              name="finePerDay"
              min="0"
              value={formData.finePerDay}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Cover Image URL (optional)
          </label>
          <input
            type="url"
            name="coverUrl"
            value={formData.coverUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>

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
            {loading ? 'Saving...' : isEditing ? 'Update Resource' : 'Create Resource'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
