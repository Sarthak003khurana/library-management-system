// ============================================
// ERRORHANDLER.JS - Centralized Error Handling Middleware
// Covers Syllabus:
// - Point 55: Express Error Middleware
// - Point 56: REST API Error Contracts & HTTP Status Codes
// ============================================

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  console.error(`[Error Handler] ${req.method} ${req.url} - ${statusCode}: ${message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
}

module.exports = errorHandler;
