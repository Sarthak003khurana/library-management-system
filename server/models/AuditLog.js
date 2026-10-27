// ============================================
// AUDITLOG.JS - Mongoose Schema for Educational Audit Logging
// Covers Syllabus:
// - Point 41: MongoDB Mongoose Schema & Validation
// ============================================

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      uppercase: true,
      trim: true
    },
    userId: {
      type: String,
      required: [true, 'User ID is required']
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info'
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
