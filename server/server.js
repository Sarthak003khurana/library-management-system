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

// Initialize isolated MongoDB demo if MONGO_URI is configured
initMongoDB();

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

// Production & local development CORS configuration
const rawCorsOrigin = process.env.CORS_ORIGIN || '';
const configuredOrigins = rawCorsOrigin
  ? rawCorsOrigin.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Non-browser or same-origin requests have no origin header
    if (!origin) return callback(null, true);

    // Development allows localhost origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Automatically allow all Vercel production and preview deployment URLs
    try {
      const parsedOrigin = new URL(origin);
      if (
        parsedOrigin.hostname === 'vercel.app' ||
        parsedOrigin.hostname.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
    } catch (_) {}

    // Check explicitly configured origins (exact match or wildcard domain)
    for (const allowed of configuredOrigins) {
      if (allowed === '*' || allowed === origin) {
        return callback(null, true);
      }
      if (allowed.startsWith('*.') && origin.endsWith(allowed.slice(1))) {
        return callback(null, true);
      }
    }

    return callback(new Error(`CORS error: Origin ${origin} not permitted`));
  },
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

// Centralized error handler middleware (Point 56)
app.use(errorHandler);

// ============================================
// SPA FALLBACK
// ============================================

app.get('*', (req, res) => {
  // Never return index.html for an unknown API route.
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      message: 'API endpoint not found'
    });
  }

  const indexPath = fs.existsSync(path.join(STATIC_DIR, 'index.html'))
    ? path.join(STATIC_DIR, 'index.html')
    : path.join(CLIENT_DIR, 'index.html');

  res.sendFile(indexPath);
});

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