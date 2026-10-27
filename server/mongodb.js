// ============================================
// MONGODB.JS - Optional Educational MongoDB / Mongoose Connector
// Covers Syllabus:
// - Point 41: MongoDB, MongoDB Atlas connection, Mongoose initialization
//
// NOTE:
// ResourceHub primarily uses Google Firebase Firestore for all production data.
// This module provides an isolated, non-disruptive educational demonstration of
// MongoDB & Mongoose. It connects only when MONGO_URI is defined.
// If MONGO_URI is absent, the application runs normally without error.
// ============================================

const mongoose = require('mongoose');

let isConnected = false;
let connectionError = null;

async function initMongoDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.log('ℹ️ Optional MongoDB educational module: MONGO_URI not set (Firestore active)');
    return { isConnected: false, status: 'disabled' };
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    connectionError = null;
    console.log('✓ MongoDB Atlas connected successfully (Educational Mongoose Module)');
    return { isConnected: true, status: 'connected' };
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`⚠️ MongoDB connection warning: ${err.message}. Core Firestore operations unaffected.`);
    return { isConnected: false, status: 'error', error: err.message };
  }
}

function getMongoStatus() {
  return {
    isConfigured: !!process.env.MONGO_URI,
    isConnected,
    error: connectionError,
    readyState: mongoose.connection.readyState,
    readyStateName: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
  };
}

module.exports = {
  mongoose,
  initMongoDB,
  getMongoStatus
};
