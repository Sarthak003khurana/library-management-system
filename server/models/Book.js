// ============================================
// BOOK.JS - Mongoose Schema for Library Books
// Stored in MongoDB Atlas (Cluster0)
// Preserves UUID string id compatibility with
// Firestore, reservations, and frontend components.
// ============================================

const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Book ID is required'],
      unique: true,
      index: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true
    },
    type: {
      type: String,
      default: 'book',
      index: true,
      trim: true
    },
    category: {
      type: String,
      default: 'General',
      index: true,
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'borrowed', 'maintenance'],
        message: '{VALUE} is not a valid status'
      },
      default: 'available',
      index: true
    },
    location: {
      type: String,
      default: 'Unassigned',
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
      default: 1
    },
    finePerDay: {
      type: Number,
      min: [0, 'Fine rate cannot be negative'],
      default: 3
    },
    isbn: {
      type: String,
      default: null,
      trim: true
    },
    author: {
      type: String,
      default: null,
      trim: true
    },
    coverUrl: {
      type: String,
      default: null
    },
    conditionRating: {
      type: Number,
      min: [1, 'Condition rating must be between 1 and 10'],
      max: [10, 'Condition rating must be between 1 and 10'],
      default: 10
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString()
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString()
    }
  },
  {
    // Disables Mongoose's default virtual 'id' mapping to '_id' so our custom 'id' is preserved
    id: false,
    versionKey: false,
    timestamps: false,
    strict: false, // Preserves all existing Firestore attributes without stripping
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret._id;
        return ret;
      }
    }
  }
);

module.exports = mongoose.models.Book || mongoose.model('Book', BookSchema);
