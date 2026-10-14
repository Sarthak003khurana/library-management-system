// ============================================
// EVENTEMITTER.JS - System Event Hub
// Covers Syllabus:
// - Point 52: Node.js Events & EventEmitters
// - Event-driven asynchronous decoupled workflows
// ============================================

const EventEmitter = require('events');

class ResourceHubEmitter extends EventEmitter {}

const eventHub = new ResourceHubEmitter();

// Audit log event listener
eventHub.on('audit:log', ({ action, userId, details, timestamp }) => {
  console.log(
    `[Audit Event] Action: ${action} | User: ${userId || 'anonymous'} | Timestamp: ${timestamp || new Date().toISOString()}`
  );
});

// Reservation notification listener
eventHub.on('reservation:created', ({ reservation, item, user }) => {
  console.log(
    `[Reservation Event] Item '${item?.title || reservation.itemId}' reserved by ${user?.name || reservation.userId}`
  );
});

// Fine generated event listener
eventHub.on('fine:assessed', ({ fine, user }) => {
  console.log(
    `[Fine Event] Fine of $${fine.amount} assessed for user ${user?.email || fine.userId}`
  );
});

module.exports = eventHub;
