// Contributor: Shivani Jindal
// ============================================
// STORAGE.JS - Safe LocalStorage Utility
// Syllabus Point 31 / 43
// ============================================

export const Storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Error writing ${key} to localStorage:`, err);
    }
  },

  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return raw || fallback;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};

export const SessionStorage = {
  set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Error writing ${key} to sessionStorage:`, err);
    }
  },

  get(key, fallback = null) {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  remove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (err) {
      console.warn(`Error removing ${key} from sessionStorage:`, err);
    }
  },

  clear() {
    try {
      sessionStorage.clear();
    } catch (err) {
      console.warn('Error clearing sessionStorage:', err);
    }
  }
};

