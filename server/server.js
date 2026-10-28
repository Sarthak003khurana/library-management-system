// ============================================
// SERVER.JS - Express app entry point
// Serves the REST API under /api and the vanilla-JS
// frontend as static files, all from one process/port.
// ============================================

// Load environment variables BEFORE importing
// routes that depend on them.
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const reservationRoutes = require('./routes/reservations');
const waitlistRoutes = require('./routes/waitlist');
const finesRoutes = require('./routes/fines');
const analyticsRoutes = require('./routes/analytics');
const { initMongoDB } = require('./mongodb');
const mongoDemoRoutes = require('./routes/mongoDemo');

const app = express();

// Initialize MongoDB Atlas connection if MONGODB_URI is configured
initMongoDB().then(async (status) => {
  if (status && status.isConnected) {
    try {
      const { ensureBooksMigrated } = require('./migrate-books-to-mongo');
      await ensureBooksMigrated();
    } catch (err) {
      console.warn('Startup migration check notice:', err.message);
    }
  }
});

// Render provides process.env.PORT.
// 5000 is used when running locally.
const PORT = process.env.PORT || 5000;

// Frontend directory: Support Vite build output (client/dist) or client directory
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
const CLIENT_DIR = path.join(__dirname, '..', 'client');
const STATIC_DIR = fs.existsSync(CLIENT_DIST) ? CLIENT_DIST : CLIENT_DIR;

// ============================================
// MIDDLEWARE
// ============================================

// ============================================
// CORS CONFIGURATION
// ============================================
// Allow all origins dynamically while supporting credentials (cookies / auth headers).
// Reflecting the incoming origin guarantees that any deployment domain
// (e.g. https://sarthak.sbs, Vercel, localhost, custom domains) is permitted.
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Request logger middleware (Point 49, 50, 53, 56)
app.use(requestLogger);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(STATIC_DIR));

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);

app.use('/api/items', itemRoutes);

app.use('/api/reservations', reservationRoutes);

app.use('/api/waitlist', waitlistRoutes);

app.use('/api/fines', finesRoutes);

app.use('/api/analytics', analyticsRoutes);

app.use('/api/mongo-demo', mongoDemoRoutes);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Library Management System API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SPA FALLBACK
// ============================================

app.get('*', (req, res, next) => {
  // Never return index.html for an unknown API route.
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }

  const indexPath = fs.existsSync(path.join(STATIC_DIR, 'index.html'))
    ? path.join(STATIC_DIR, 'index.html')
    : path.join(CLIENT_DIR, 'index.html');

  res.sendFile(indexPath, (err) => {
    if (err) {
      next(err);
    }
  });
});

// Centralized error handler middleware (Point 56)
app.use(errorHandler);


// ============================================
// START SERVER
// ============================================

// 0.0.0.0 is important when deploying to platforms
// such as Render. It also works normally on localhost.
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('============================================');
  console.log(' Library Management System');
  console.log('============================================');
  console.log(` Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(' Firebase Admin authentication enabled');
  console.log('============================================');
  console.log('');
});