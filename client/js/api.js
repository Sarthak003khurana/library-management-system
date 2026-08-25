// Contributor: Shivani Jindal
// ============================================
// API.JS - Fetch wrapper for all backend calls
// Covers: Async/Await, Promises, Fetch API, JSON, Error Handling
// ============================================
import { Storage } from './storage.js';

export const API = {
  async request(endpoint, options = {}) {
    const token = Storage.get('token');
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    };
    if (options.body) config.body = JSON.stringify(options.body);

    const response = await fetch(endpoint, config);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      throw new Error(data?.message || `Request failed (${response.status})`);
    }
    return data;
  },
  get(endpoint) {
    return this.request(endpoint);
  },
  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },
  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
