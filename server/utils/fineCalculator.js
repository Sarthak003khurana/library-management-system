// ============================================
// FINE CALCULATOR - Late fees + condition-based partial fines
// Covers: Functions, Type Conversion, Operators, Conditionals
// ============================================

function calculateLateFee({ dueDate, returnedAt, dailyRate, graceDays = 1, cap = 100 }) {
  const due = new Date(dueDate).getTime();
  const returned = new Date(returnedAt || Date.now()).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;

  const daysLate = Math.floor((returned - due) / msPerDay) - graceDays;
  if (daysLate <= 0) return 0;

  return Math.min(daysLate * dailyRate, cap);
}

function calculateConditionFine({ ratingBefore, ratingAfter, penaltyPerPoint = 5 }) {
  const before = Number(ratingBefore);
  const after = Number(ratingAfter);
  const diff = before - after;
  return diff > 0 ? diff * penaltyPerPoint : 0;
}

module.exports = { calculateLateFee, calculateConditionFine };
