// ============================================
// DEMOCATEGORY.JS - Mongoose Schema & Model
// Covers Syllabus:
// - Point 41: MongoDB / Mongoose Schemas, Validation
// ============================================

const mongoose = require('mongoose');

const DemoCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters long'],
      maxlength: [60, 'Category name cannot exceed 60 characters']
    },
    description: {
      type: String,
      trim: true,
      default: 'General Category'
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DemoCategory || mongoose.model('DemoCategory', DemoCategorySchema);
