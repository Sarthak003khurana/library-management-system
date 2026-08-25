// Contributor: Shivani Jindal
// ============================================
// STORAGE.JS - localStorage wrapper
// Covers: Local Storage, JSON, ES6 default params
// ============================================
export const Storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  }
};
