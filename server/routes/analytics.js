// ============================================
// ANALYTICS ROUTES - Admin Dashboard Aggregates
// Covers Syllabus:
// - Point 50: Asynchronous Operations with async/await
// - Point 55 & 56: REST API Endpoint & Error Middleware
// - Point 59: Firestore DB queries & array transformations
// ============================================

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

const router = express.Router();

router.get('/overview', requireAuth, allowRoles('admin', 'lab_manager'), async (req, res, next) => {
  try {
    const [items, reservations, fines] = await Promise.all([
      db.get('items'),
      db.get('reservations'),
      db.get('fines')
    ]);

    const itemsMap = new Map((items || []).map(item => [item.id, item]));

    // Most borrowed items
    const borrowCounts = (reservations || []).reduce((acc, r) => {
      if (r.itemId) {
        acc[r.itemId] = (acc[r.itemId] || 0) + 1;
      }
      return acc;
    }, {});

    const mostBorrowed = Object.entries(borrowCounts)
      .map(([itemId, count]) => {
        const item = itemsMap.get(itemId);
        return { title: item ? item.title : 'Unknown', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Category usage
    const categoryUsage = (items || []).reduce((acc, item) => {
      const cat = item.category || 'General';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    // Overdue count right now
    const now = Date.now();
    const overdueCount = (reservations || []).filter(r =>
      (r.status === 'active' || r.status === 'borrowed') && r.dueDate && new Date(r.dueDate).getTime() < now
    ).length;

    // Fines collected vs outstanding
    const finesCollected = (fines || []).filter(f => f.paid || f.status === 'paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const finesOutstanding = (fines || []).filter(f => !f.paid && f.status !== 'paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    // Weekly overdue trend (last 6 weeks)
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const weekStart = now - (5 - i) * 7 * 86400000;
      const weekEnd = weekStart + 7 * 86400000;
      const count = (reservations || []).filter(r => {
        if (!r.dueDate) return false;
        const due = new Date(r.dueDate).getTime();
        return due >= weekStart && due < weekEnd && (
          (r.status === 'active' || r.status === 'borrowed')
            ? due < now
            : r.returnedAt && new Date(r.returnedAt).getTime() > due
        );
      }).length;
      return { week: `W${i + 1}`, overdue: count };
    });

    // Active loans count
    const activeLoans = (reservations || []).filter(r => r.status === 'active' || r.status === 'borrowed').length;

    res.json({
      totalItems: items.length,
      totalReservations: reservations.length,
      activeLoans,
      overdueCount,
      finesCollected,
      finesOutstanding,
      mostBorrowed,
      categoryUsage,
      overdueTrend: weeks
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
