// ============================================
// DEMOITEM.JS - Mongoose Schema with .populate() reference
// Covers Syllabus:
// - Point 41: MongoDB / Mongoose Schemas, Validation, Reference & Populate
// ============================================

const mongoose = require('mongoose');

const DemoItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['book', 'equipment'],
        message: '{VALUE} is not a valid resource type'
      },
      default: 'book'
    },
    // Reference to DemoCategory model for .populate() demonstration
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DemoCategory',
      required: [true, 'Category reference ID is required']
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 1
    },
    finePerDay: {
      type: Number,
      min: [0, 'Fine rate cannot be negative'],
      default: 3
    },
    status: {
      type: String,
      enum: ['available', 'maintenance', 'borrowed'],
      default: 'available'
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DemoItem || mongoose.model('DemoItem', DemoItemSchema);
