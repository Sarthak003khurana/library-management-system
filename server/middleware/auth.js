// ============================================
// AUTH.JS (middleware)
// JWT verification + Role-Based Access Control
// ============================================

const jwt = require('jsonwebtoken');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing in production!');
  throw new Error('FATAL: JWT_SECRET environment variable is required in production');
}

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-secret-change-me';


// ============================================
// AUTHENTICATION
// ============================================
// Checks whether the request contains a valid
// ResourceHub JWT.
//
// After verification:
//
// req.user = {
//   id,
//   name,
//   email,
//   role
// }
// ============================================

// ============================================
// FORCED PASSWORD CHANGE ENFORCEMENT
// ============================================
// When mustChangePassword === true, block normal application API
// requests even if they bypass the React UI and call the API directly.
// Only endpoints needed to change the password and safely sign out are allowed.
// Privileged roles (admin, lab_manager) cannot bypass this restriction.
// ============================================

function isExemptFromPasswordChange(req) {
  const url = (req.originalUrl || req.url || '').split('?')[0].replace(/\/+$/, '');
  const path = (req.path || '').split('?')[0].replace(/\/+$/, '');
  const baseUrl = (req.baseUrl || '').split('?')[0].replace(/\/+$/, '');
  const fullPath = (baseUrl + path).replace(/\/+/g, '/').replace(/\/+$/, '');

  const isChangePassword =
    url === '/api/auth/change-password' ||
    url === '/change-password' ||
    path === '/change-password' ||
    fullPath === '/api/auth/change-password' ||
    fullPath === '/change-password';

  const isLogout =
    url === '/api/auth/logout' ||
    url === '/logout' ||
    path === '/logout' ||
    fullPath === '/api/auth/logout' ||
    fullPath === '/logout';

  return isChangePassword || isLogout;
}

// Function to fetch authoritative user by ID
async function getAuthoritativeUser(userId) {
  if (!userId) return null;

  // Custom user resolver hook (for unit testing isolation)
  if (typeof getAuthoritativeUser.resolver === 'function') {
    return await getAuthoritativeUser.resolver(userId);
  }

  // 1. Authoritative Firestore record
  try {
    const { firestore } = require('../firebase');
    if (firestore && typeof firestore.collection === 'function') {
      const doc = await firestore.collection('users').doc(userId).get();
      if (doc && doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
    }
  } catch (err) {
    // Firestore unavailable or failed
  }

  // 2. Fallback to db persistence layer
  try {
    const db = require('../db');
    if (db && typeof db.findById === 'function') {
      const user = await db.findById('users', userId);
      if (user) return user;
    }
  } catch (err) {
    // db fallback unavailable or failed
  }

  return null;
}

async function enforcePasswordChange(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  // Exempt change-password and logout endpoints
  if (isExemptFromPasswordChange(req)) {
    return next();
  }

  try {
    // Check authoritative user record to prevent stale JWT claim bypass
    const authoritativeUser = await getAuthoritativeUser(req.user.id);
    const mustChange = authoritativeUser
      ? authoritativeUser.mustChangePassword === true
      : req.user.mustChangePassword === true;

    if (mustChange) {
      return res.status(403).json({
        message: 'Password change required. You must change your temporary password before accessing the system.',
        mustChangePassword: true
      });
    }

    if (authoritativeUser) {
      req.currentUser = authoritativeUser;
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

async function requireAuth(req, res, next) {

  const header =
    req.headers.authorization || '';

  const token =
    header.startsWith('Bearer ')
      ? header.slice(7)
      : null;


  if (!token) {

    return res.status(401).json({
      message: 'No token provided'
    });

  }


  try {

    const payload =
      jwt.verify(
        token,
        JWT_SECRET
      );


    req.user = payload;

  } catch (err) {

    return res.status(401).json({
      message:
        'Invalid or expired token'
    });

  }

  return enforcePasswordChange(req, res, next);

}


// ============================================
// ROLE-BASED ACCESS CONTROL
// ============================================
//
// Usage:
//
// router.post(
//   '/items',
//   requireAuth,
//   requireRole('admin', 'lab_manager'),
//   handler
// );
//
// Multiple roles can be provided.
//
// Example:
//
// requireRole('admin')
//
// Only admin.
//
// Example:
//
// requireRole(
//   'admin',
//   'lab_manager'
// )
//
// Admin OR Lab Manager.
// ============================================

function requireRole(...allowedRoles) {

  return (req, res, next) => {

    // ----------------------------------------
    // User must already be authenticated
    // ----------------------------------------

    if (!req.user) {

      return res.status(401).json({
        message:
          'Authentication required'
      });

    }


    // ----------------------------------------
    // Check user's role
    // ----------------------------------------

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {

      return res.status(403).json({
        message:
          'You do not have permission to perform this action',
        requiredRoles:
          allowedRoles,
        currentRole:
          req.user.role
      });

    }


    next();

  };

}


// ============================================
// CONVENIENCE ROLE MIDDLEWARES
// ============================================

// Admin only
function requireAdmin(
  req,
  res,
  next
) {

  return requireRole(
    'admin'
  )(
    req,
    res,
    next
  );

}


// Admin OR Lab Manager
function requireManager(
  req,
  res,
  next
) {

  return requireRole(
    'admin',
    'lab_manager'
  )(
    req,
    res,
    next
  );

}


// Student OR Faculty
function requireStudentOrFaculty(
  req,
  res,
  next
) {

  return requireRole(
    'student',
    'faculty'
  )(
    req,
    res,
    next
  );

}


// ============================================
// EXPORTS
// ============================================

module.exports = {

  requireAuth,

  enforcePasswordChange,

  getAuthoritativeUser,

  requireRole,

  requireAdmin,

  requireManager,

  requireStudentOrFaculty,

  JWT_SECRET

};