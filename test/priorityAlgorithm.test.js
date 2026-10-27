// ============================================
// TEST: PRIORITY ALGORITHM
// Unit tests for waitlist priority scoring:
// role weighting, reliability clamping, urgency factors,
// and time waiting component.
// ============================================

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { calculatePriority, ROLE_WEIGHTS, URGENCY_WEIGHTS } = require('../server/utils/priorityAlgorithm');

describe('Priority Algorithm - calculatePriority', () => {
  it('should calculate higher score for faculty than student with equal parameters', () => {
    const requestedAt = new Date().toISOString();

    const faculty = calculatePriority({
      userRole: 'faculty',
      reliabilityScore: 80,
      urgency: 'normal',
      requestedAt
    });

    const student = calculatePriority({
      userRole: 'student',
      reliabilityScore: 80,
      urgency: 'normal',
      requestedAt
    });

    assert.ok(faculty.score > student.score, `Faculty (${faculty.score}) should outrank student (${student.score})`);
    assert.strictEqual(faculty.breakdown.role, ROLE_WEIGHTS.faculty * 0.3);
    assert.strictEqual(student.breakdown.role, ROLE_WEIGHTS.student * 0.3);
  });

  it('should clamp reliability score between 0 and 100', () => {
    const requestedAt = new Date().toISOString();

    const negativeScore = calculatePriority({
      userRole: 'student',
      reliabilityScore: -50,
      urgency: 'normal',
      requestedAt
    });
    assert.strictEqual(negativeScore.breakdown.reliability, 0);

    const excessiveScore = calculatePriority({
      userRole: 'student',
      reliabilityScore: 250,
      urgency: 'normal',
      requestedAt
    });
    assert.strictEqual(excessiveScore.breakdown.reliability, 100 * 0.4);
  });

  it('should award maximum urgency score for critical requests', () => {
    const requestedAt = new Date().toISOString();

    const normalReq = calculatePriority({
      userRole: 'student',
      urgency: 'normal',
      requestedAt
    });

    const criticalReq = calculatePriority({
      userRole: 'student',
      urgency: 'critical',
      requestedAt
    });

    assert.strictEqual(criticalReq.breakdown.urgency, URGENCY_WEIGHTS.critical * 0.2); // 20
    assert.strictEqual(normalReq.breakdown.urgency, URGENCY_WEIGHTS.normal * 0.2); // 8
    assert.ok(criticalReq.score > normalReq.score);
  });

  it('should accrue time points for longer wait times', () => {
    const now = Date.now();
    const wait24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const wait1h = new Date(now - 1 * 60 * 60 * 1000).toISOString();

    const result24h = calculatePriority({ userRole: 'student', requestedAt: wait24h });
    const result1h = calculatePriority({ userRole: 'student', requestedAt: wait1h });

    assert.ok(result24h.breakdown.time > result1h.breakdown.time);
  });

  it('should default unknown roles to 50', () => {
    const requestedAt = new Date().toISOString();
    const result = calculatePriority({ userRole: 'guest', requestedAt });
    assert.strictEqual(result.breakdown.role, 50 * 0.3);
  });
});
