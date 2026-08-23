// ============================================
// SERVER.JS - Express app entry point
// Serves the REST API under /api and the vanilla-JS
// frontend as static files, all from one process/port
// so there's no CORS setup and nothing extra to run.
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

const PORT =
  process.env.PORT || 5000;

const CLIENT_DIR =
  path.join(__dirname, '..', 'client');


// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());

app.use(
  express.static(CLIENT_DIR)
);


// ============================================
// API ROUTES
// ============================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/items',
  itemRoutes
);

app.use(
  '/api/reservations',
  reservationRoutes
);

app.use(
  '/api/waitlist',
  waitlistRoutes
);

app.use(
  '/api/fines',
  finesRoutes
);

app.use(
  '/api/analytics',
  analyticsRoutes
);


// ============================================
// HEALTH CHECK
// ============================================

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      status: 'ok'
    });
  }
);


// ============================================
// SPA FALLBACK
// ============================================

app.get(
  '*',
  (req, res) => {

    if (
      req.path.startsWith('/api/')
    ) {

      return res
        .status(404)
        .json({
          message: 'Not found'
        });
    }

    res.sendFile(
      path.join(
        CLIENT_DIR,
        'index.html'
      )
    );

  }
);


// ============================================
// START SERVER
// ============================================

app.listen(
  PORT,
  () => {

    console.log(
      `\n  ResourceHub server running at http://localhost:${PORT}\n`
    );

    console.log(
      '  Firebase Admin authentication enabled'
    );

    console.log(
      '\n  Demo accounts (password: password123):'
    );

    console.log(
      '    alice@uni.edu   -> student'
    );

    console.log(
      '    bob@uni.edu     -> faculty'
    );

    console.log(
      '    carol@uni.edu   -> admin'
    );

    console.log(
      '    dave@uni.edu    -> lab_manager\n'
    );

  }
);