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

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const reservationRoutes = require('./routes/reservations');
const waitlistRoutes = require('./routes/waitlist');
const finesRoutes = require('./routes/fines');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Render provides process.env.PORT.
// 5000 is used when running locally.
const PORT = process.env.PORT || 5000;

// Frontend directory
const CLIENT_DIR = path.join(__dirname, '..', 'client');

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(CLIENT_DIR));

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);

app.use('/api/items', itemRoutes);

app.use('/api/reservations', reservationRoutes);

app.use('/api/waitlist', waitlistRoutes);

app.use('/api/fines', finesRoutes);

app.use('/api/analytics', analyticsRoutes);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Library Management System API is running'
  });
});

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

  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
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