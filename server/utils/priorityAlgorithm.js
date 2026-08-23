// ============================================
// PRIORITY ALGORITHM - Smart Waitlist scoring
// Covers: Destructuring, Arrow Functions, Objects, ES6
// Score is 0-100, built from 4 weighted components so it can be
// shown as a transparent breakdown in the UI (not a black box).
// ============================================

const ROLE_WEIGHTS = { admin: 100, lab_manager: 90, faculty: 80, student: 50 };
const URGENCY_WEIGHTS = { critical: 100, high: 70, normal: 40 };

function calculatePriority({ userRole, reliabilityScore = 70, urgency = 'normal', requestedAt }) {
  const roleComponent = (ROLE_WEIGHTS[userRole] ?? 50);
  const reliabilityComponent = Math.max(0, Math.min(100, reliabilityScore));
  const urgencyComponent = (URGENCY_WEIGHTS[urgency] ?? 40);

  const hoursWaiting = (Date.now() - new Date(requestedAt).getTime()) / (1000 * 60 * 60);
  const timeComponent = Math.min(hoursWaiting * 0.5, 100); // caps out after ~200 hours

  const breakdown = {
    role: roleComponent * 0.3,
    reliability: reliabilityComponent * 0.4,
    urgency: urgencyComponent * 0.2,
    time: timeComponent * 0.1
  };

  const score = breakdown.role + breakdown.reliability + breakdown.urgency + breakdown.time;

  return { score: Math.round(score * 10) / 10, breakdown };
}

module.exports = { calculatePriority, ROLE_WEIGHTS, URGENCY_WEIGHTS };
