// ============================================
// TEST: FINE CALCULATOR
// Unit tests for late fee calculations, grace periods,
// fee caps, and condition damage penalties.
// ============================================

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { calculateLateFee, calculateConditionFine } = require('../server/utils/fineCalculator');

describe('Fine Calculator - calculateLateFee', () => {
  const dailyRate = 2; // $2 per day

  it('should return 0 fine if returned on or before due date', () => {
    const dueDate = new Date('2026-10-20T10:00:00Z').toISOString();
    const returnedAt = new Date('2026-10-19T15:00:00Z').toISOString();

    const fine = calculateLateFee({ dueDate, returnedAt, dailyRate });
    assert.strictEqual(fine, 0);
  });

  it('should apply grace period: 1 day late with 1 grace day incurs 0 fee', () => {
    const dueDate = new Date('2026-10-20T10:00:00Z').toISOString();
    // Exactly 1 day later
    const returnedAt = new Date('2026-10-21T10:00:00Z').toISOString();

    const fine = calculateLateFee({ dueDate, returnedAt, dailyRate, graceDays: 1 });
    assert.strictEqual(fine, 0);
  });

  it('should calculate late fee correctly when exceeding grace period', () => {
    const dueDate = new Date('2026-10-20T10:00:00Z').toISOString();
    // 4 days late with 1 grace day => 3 billable late days @ $2 = $6
    const returnedAt = new Date('2026-10-24T10:00:00Z').toISOString();

    const fine = calculateLateFee({ dueDate, returnedAt, dailyRate, graceDays: 1, cap: 50 });
    assert.strictEqual(fine, 6);
  });

  it('should respect the fee cap', () => {
    const dueDate = new Date('2026-01-01T10:00:00Z').toISOString();
    // 100 days late
    const returnedAt = new Date('2026-04-11T10:00:00Z').toISOString();
    const cap = 25;

    const fine = calculateLateFee({ dueDate, returnedAt, dailyRate: 5, graceDays: 0, cap });
    assert.strictEqual(fine, 25);
  });

  it('should handle custom grace days', () => {
    const dueDate = new Date('2026-10-10T10:00:00Z').toISOString();
    // 3 days late with 3 grace days => 0
    const returnedAt = new Date('2026-10-13T10:00:00Z').toISOString();

    const fine = calculateLateFee({ dueDate, returnedAt, dailyRate: 10, graceDays: 3 });
    assert.strictEqual(fine, 0);
  });
});

describe('Fine Calculator - calculateConditionFine', () => {
  it('should assess penalty when returned in worse condition', () => {
    // Rating dropped from 5 (mint) to 3 (fair) => diff 2 * $5 = $10
    const fine = calculateConditionFine({ ratingBefore: 5, ratingAfter: 3, penaltyPerPoint: 5 });
    assert.strictEqual(fine, 10);
  });

  it('should return 0 fine if condition is identical', () => {
    const fine = calculateConditionFine({ ratingBefore: 4, ratingAfter: 4 });
    assert.strictEqual(fine, 0);
  });

  it('should return 0 fine if condition improved (e.g. refurbished/cleaned)', () => {
    const fine = calculateConditionFine({ ratingBefore: 3, ratingAfter: 4 });
    assert.strictEqual(fine, 0);
  });

  it('should correctly parse string ratings', () => {
    const fine = calculateConditionFine({ ratingBefore: '5', ratingAfter: '2', penaltyPerPoint: 10 });
    assert.strictEqual(fine, 30);
  });
});
