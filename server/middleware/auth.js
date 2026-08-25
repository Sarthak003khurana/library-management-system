// ============================================
// AUTH.JS (middleware)
// JWT verification + Role-Based Access Control
// ============================================

const jwt = require('jsonwebtoken');

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

function requireAuth(req, res, next) {

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


    next();

  } catch (err) {

    return res.status(401).json({
      message:
        'Invalid or expired token'
    });

  }

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

  requireRole,

  requireAdmin,

  requireManager,

  requireStudentOrFaculty,

  JWT_SECRET

};