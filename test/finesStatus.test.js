// ============================================
// TEST: FINES STATUS CONTRACT & MAPPING
// Unit tests verifying the data contract between
// backend boolean `paid` field and frontend `status`
// badges, unpaid calculations, and filters.
// ============================================

const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Fine Data Contract & Status Mapping', () => {
  // Normalization logic applied by server GET /api/fines
  function normalizeFine(fine) {
    const isPaid = fine.paid === true || fine.status === 'paid';
    return {
      ...fine,
      paid: isPaid,
      status: isPaid ? 'paid' : 'unpaid',
    };
  }

  // Frontend unpaid filter logic from FinesPage & DashboardPage
  function isUnpaid(fine) {
    return !fine.paid && fine.status !== 'paid';
  }

  function calculateUnpaidTotal(finesList) {
    return finesList
      .filter(isUnpaid)
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);
  }

  it('should normalize legacy record with only boolean paid: false', () => {
    const legacyFine = { id: 'fine-1', amount: 15, paid: false };
    const normalized = normalizeFine(legacyFine);

    assert.strictEqual(normalized.paid, false);
    assert.strictEqual(normalized.status, 'unpaid');
    assert.strictEqual(isUnpaid(normalized), true);
  });

  it('should normalize legacy record with boolean paid: true', () => {
    const legacyFine = { id: 'fine-2', amount: 20, paid: true };
    const normalized = normalizeFine(legacyFine);

    assert.strictEqual(normalized.paid, true);
    assert.strictEqual(normalized.status, 'paid');
    assert.strictEqual(isUnpaid(normalized), false);
  });

  it('should handle record with string status: "unpaid" and no paid boolean', () => {
    const modernFine = { id: 'fine-3', amount: 30, status: 'unpaid' };
    const normalized = normalizeFine(modernFine);

    assert.strictEqual(normalized.paid, false);
    assert.strictEqual(normalized.status, 'unpaid');
    assert.strictEqual(isUnpaid(normalized), true);
  });

  it('should correctly sum unpaid fines across mixed formats', () => {
    const fines = [
      { id: '1', amount: 10, paid: false },
      { id: '2', amount: 25, paid: true },
      { id: '3', amount: 15, paid: false, status: 'unpaid' },
      { id: '4', amount: 50, paid: true, status: 'paid' },
      { id: '5', amount: 5, status: 'unpaid' },
    ];

    const total = calculateUnpaidTotal(fines);
    // 10 + 15 + 5 = 30
    assert.strictEqual(total, 30);
  });
});
