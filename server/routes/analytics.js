// ============================================
// ANALYTICS ROUTES - admin dashboard aggregates
// Covers: reduce, map, filter, sort - heavy higher-order-function use
// ============================================
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

const router = express.Router();

router.get('/overview', requireAuth, allowRoles('admin', 'lab_manager'), (req, res) => {
  const items = db.get('items');
  const reservations = db.get('reservations');
  const fines = db.get('fines');

  // Most borrowed items
  const borrowCounts = reservations.reduce((acc, r) => {
    acc[r.itemId] = (acc[r.itemId] || 0) + 1;
    return acc;
  }, {});
  const mostBorrowed = Object.entries(borrowCounts)
    .map(([itemId, count]) => {
      const item = db.findById('items', itemId);
      return { title: item ? item.title : 'Unknown', count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Category usage
  const categoryUsage = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  // Overdue count right now
  const now = Date.now();
  const overdueCount = reservations.filter(r =>
    r.status === 'active' && new Date(r.dueDate).getTime() < now
  ).length;

  // Fines collected vs outstanding
  const finesCollected = fines.filter(f => f.paid).reduce((sum, f) => sum + f.amount, 0);
  const finesOutstanding = fines.filter(f => !f.paid).reduce((sum, f) => sum + f.amount, 0);

  // Weekly overdue trend (last 6 weeks, based on reservations that became overdue)
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const weekStart = now - (5 - i) * 7 * 86400000;
    const weekEnd = weekStart + 7 * 86400000;
    const count = reservations.filter(r => {
      const due = new Date(r.dueDate).getTime();
      return due >= weekStart && due < weekEnd && (r.status === 'active' ? due < now : r.returnedAt && new Date(r.returnedAt).getTime() > due);
    }).length;
    return { week: `W${i + 1}`, overdue: count };
  });

  res.json({
    totalItems: items.length,
    totalReservations: reservations.length,
    overdueCount,
    finesCollected,
    finesOutstanding,
    mostBorrowed,
    categoryUsage,
    overdueTrend: weeks
  });
});

module.exports = router;
