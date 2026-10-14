// ============================================
// API.JS - Centralized Axios HTTP Service
// Covers Syllabus:
// - Point 44: Axios and API Integration
//   * Configurable backend base URL (VITE_API_URL / fallback)
//   * Request and response interceptors
//   * Automatic Authorization header injection
//   * Uniform error normalization
// ============================================

import axios from 'axios';
import { Storage } from '../utils/storage.js';

// Base URL: In local dev, empty string lets Vite proxy forward '/api' to localhost:5000.
// In production, can be set to https://library-management-system-xnax.onrender.com or same host.
const baseURL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Bearer Token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = Storage.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error payloads
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    
    // Create enriched error object
    const enhancedError = new Error(customMessage);
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;

    // Handle session expiration (401)
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized request. Clearing session.');
    }

    return Promise.reject(enhancedError);
  }
);

export const API = {
  get(endpoint, config = {}) {
    return apiClient.get(endpoint, config);
  },
  post(endpoint, body, config = {}) {
    return apiClient.post(endpoint, body, config);
  },
  put(endpoint, body, config = {}) {
    return apiClient.put(endpoint, body, config);
  },
  delete(endpoint, config = {}) {
    return apiClient.delete(endpoint, config);
  },
  // Direct client instance access if needed (e.g. for custom headers/upload progress)
  client: apiClient,
};

export default API;
