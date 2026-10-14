// ============================================
// LOGGER.JS - Request & Performance Logging Middleware
// Covers Syllabus:
// - Point 49: Node.js Fundamentals & Globals (process.hrtime)
// - Point 50: Event Loop & Asynchronous non-blocking lifecycle
// - Point 53: HTTP Request-Response Lifecycle
// - Point 56: Express Middleware
// ============================================

function requestLogger(req, res, next) {
  const startTime = process.hrtime();
  const timestamp = new Date().toISOString();

  // Attach listener to response finish event (Event Loop & Events concept)
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const timeInMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
    const status = res.statusCode;
    
    // Status color hint in console
    const statusIcon = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✓';
    console.log(
      `[${timestamp}] ${statusIcon} ${req.method} ${req.originalUrl || req.url} | Status: ${status} | Duration: ${timeInMs}ms`
    );
  });

  next();
}

module.exports = requestLogger;
