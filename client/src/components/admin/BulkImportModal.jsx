// ============================================
// BULKIMPORTMODAL.JSX - Batch Resource Importer
// Covers Syllabus:
// - Point 35: useState for Import Payload, Selected File & Validation
// - Point 44: Axios HTTP Calls (JSON & Multipart/form-data)
// - Point 52 & 58: Data Parsing, Stream/Buffer Import & Multer Integration
// ============================================

import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { API } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function BulkImportModal({ isOpen, onClose, onSuccess }) {
  const { success, error, info } = useToast();
  const [jsonText, setJsonText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const sampleJson = `[
  {
    "title": "Introduction to Algorithms",
    "type": "book",
    "category": "Computer Science",
    "quantity": 5,
    "location": "Shelf 1A",
    "finePerDay": 3,
    "author": "Thomas H. Cormen"
  },
  {
    "title": "Digital Oscilloscope 100MHz",
    "type": "equipment",
    "category": "Electronics Lab",
    "quantity": 2,
    "location": "Bench 4",
    "finePerDay": 15
  }
]`;

  const handleInsertSample = () => {
    setSelectedFile(null);
    setJsonText(sampleJson);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    info(`Selected file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (file.name.endsWith('.json')) {
        setJsonText(content);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV to JSON converter for preview
        const lines = content.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = values[idx] || '';
            });
            return obj;
          });
          setJsonText(JSON.stringify(rows, null, 2));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      // If a file was selected, execute upload via Multer multipart endpoint (Point 52 & 58)
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await API.client.post('/api/items/bulk-import-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        success(`Uploaded "${selectedFile.name}" and created ${res.data?.importedCount || 'all'} resources!`);
        onSuccess?.();
        onClose();
        return;
      }

      // Otherwise parse JSON payload and send via standard REST endpoint
      let rows;
      try {
        rows = JSON.parse(jsonText);
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error('Payload must be a non-empty JSON array of items.');
        }
      } catch (err) {
        error(`Invalid JSON: ${err.message}`);
        setLoading(false);
        return;
      }

      const res = await API.post('/api/items/bulk-import', { items: rows });
      success(`Imported ${res.importedCount || rows.length} items successfully!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Bulk import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Batch Resource Import" maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-slate-500">
            Paste a JSON array of items or upload a <code>.json</code> or <code>.csv</code> file.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInsertSample}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Paste Sample
            </button>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span>📁 Upload File</span>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">
              📎 Selected file: <span className="font-mono">{selectedFile.name}</span> (will be uploaded via Multer Buffer stream)
            </span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-slate-400 hover:text-rose-600 font-bold ml-2"
              title="Remove file"
            >
              ✕
            </button>
          </div>
        )}

        <div>
          <textarea
            rows="10"
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (selectedFile) setSelectedFile(null); // Switch to manual edit mode if typed
            }}
            placeholder='[ { "title": "...", "type": "book", "quantity": 3 } ]'
            required={!selectedFile}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
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
            {loading ? 'Importing Batch...' : selectedFile ? 'Upload & Import File' : 'Execute Import'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
