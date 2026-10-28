// ============================================
// MONGODB.JS - MongoDB Atlas / Mongoose Connector
// Manages database connection to MongoDB Atlas (Cluster0)
// Supports MONGODB_URI (standard) and MONGO_URI (legacy)
// Safe error handling: never exposes connection secrets.
// Explicitly targets the 'resourcehub' database.
// ============================================

const mongoose = require('mongoose');

let isConnected = false;
let connectionError = null;

// Helper to sanitize any error strings so credentials/URIs can never leak
function sanitizeCredentials(str) {
  if (!str) return '';
  return String(str)
    .replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi, 'mongodb$1://<redacted-credentials>@')
    .replace(/mongodb(\+srv)?:\/\/[^\s@]+@[^\s/]+/gi, 'mongodb$1://<redacted-credentials>@<cluster>')
    .replace(/:\/\/.*@/gi, '://<redacted-credentials>@');
}

async function initMongoDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.log('ℹ️ MongoDB Atlas connector: MONGODB_URI not configured. Operating in Firestore-only mode.');
    return { isConnected: false, status: 'disabled' };
  }

  // Reuse active connection if already connected
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    connectionError = null;
    return { isConnected: true, status: 'connected' };
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'resourcehub', // Explicitly locks target database to 'resourcehub'
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    isConnected = true;
    connectionError = null;
    const targetDb = mongoose.connection.name || 'resourcehub';
    console.log(`✓ MongoDB Atlas connected successfully (Cluster0 / Database: ${targetDb})`);
    return { isConnected: true, status: 'connected', dbName: targetDb };
  } catch (err) {
    isConnected = false;
    const safeError = sanitizeCredentials(`${err.name}: ${err.message}`);
    connectionError = safeError;
    console.warn(`⚠️ MongoDB Atlas connection notice: ${safeError}. Core services continue.`);
    return { isConnected: false, status: 'error', error: safeError };
  }
}

function getMongoStatus() {
  const uriConfigured = !!(process.env.MONGODB_URI || process.env.MONGO_URI);
  const readyState = mongoose.connection.readyState;
  const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  return {
    isConfigured: uriConfigured,
    isConnected: readyState === 1,
    targetDatabase: 'resourcehub',
    activeDatabase: mongoose.connection.name || (readyState === 1 ? 'resourcehub' : null),
    error: connectionError,
    readyState,
    readyStateName: stateNames[readyState] || 'unknown'
  };
}

module.exports = {
  mongoose,
  initMongoDB,
  getMongoStatus,
  sanitizeCredentials
};
