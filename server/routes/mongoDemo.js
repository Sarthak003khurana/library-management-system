// ============================================
// MONGODEMO.JS - Educational MongoDB & Mongoose Router
// Covers Syllabus:
// - Point 41: MongoDB, Atlas, CRUD operations, Mongoose Schemas,
//   Models, Validation, and .populate()
// ============================================

const express = require('express');
const { getMongoStatus } = require('../mongodb');
const DemoCategory = require('../models/DemoCategory');
const DemoItem = require('../models/DemoItem');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Middleware ensuring MongoDB is connected before running demo operations
function requireMongo(req, res, next) {
  const status = getMongoStatus();
  if (!status.isConnected) {
    return res.status(503).json({
      success: false,
      message: 'MongoDB educational module is not connected. Configure MONGO_URI in .env to enable.',
      status
    });
  }
  next();
}

// --------------------------------------------
// 1. MODULE STATUS
// --------------------------------------------
router.get('/status', (req, res) => {
  const status = getMongoStatus();
  res.json({
    module: 'MongoDB / Mongoose Educational Demonstration',
    syllabusPoint: 41,
    status,
    instructions: status.isConnected
      ? 'MongoDB Atlas is active. You can execute CRUD and .populate() requests.'
      : 'To activate, configure MONGODB_URI in server environment variables.'
  });
});

// --------------------------------------------
// 2. CATEGORIES CRUD (Mongoose Model & Validation)
// --------------------------------------------
router.get('/categories', requireMongo, async (req, res, next) => {
  try {
    const categories = await DemoCategory.find().sort({ createdAt: -1 });
    res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', requireMongo, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = new DemoCategory({ name, description });
    await category.save();
    res.status(201).json({ success: true, message: 'Category created with Mongoose validation', category });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, errors: err.errors, message: err.message });
    }
    next(err);
  }
});

// --------------------------------------------
// 3. ITEMS CRUD WITH .populate('category')
// --------------------------------------------
router.get('/items', requireMongo, async (req, res, next) => {
  try {
    // Demonstrates Mongoose .populate() referencing DemoCategory
    const items = await DemoItem.find()
      .populate('category', 'name description')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: items.length, items });
  } catch (err) {
    next(err);
  }
});

router.post('/items', requireMongo, async (req, res, next) => {
  try {
    const { title, type, category, quantity, finePerDay } = req.body;
    const item = new DemoItem({
      title,
      type,
      category,
      quantity,
      finePerDay
    });

    await item.save();

    // Populate category reference before returning
    await item.populate('category', 'name description');

    res.status(201).json({ success: true, message: 'Resource created with Mongoose validation and populate', item });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, errors: err.errors, message: err.message });
    }
    next(err);
  }
});

router.put('/items/:id', requireMongo, async (req, res, next) => {
  try {
    const updated = await DemoItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('category', 'name description');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Resource not found in MongoDB' });
    }

    res.json({ success: true, message: 'Resource updated via findByIdAndUpdate', item: updated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, errors: err.errors, message: err.message });
    }
    next(err);
  }
});

router.delete('/items/:id', requireMongo, async (req, res, next) => {
  try {
    const deleted = await DemoItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Resource not found in MongoDB' });
    }
    res.json({ success: true, message: 'Resource deleted via findByIdAndDelete', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// --------------------------------------------
// 4. ONE-CLICK EDUCATIONAL SEED & POPULATE DEMO
// --------------------------------------------
router.post('/seed', requireMongo, async (req, res, next) => {
  try {
    // 1. Create categories
    const catTech = await DemoCategory.findOneAndUpdate(
      { name: 'Computer Science & Software' },
      { name: 'Computer Science & Software', description: 'Computing, Algorithms, and Architecture' },
      { upsert: true, new: true }
    );

    const catLab = await DemoCategory.findOneAndUpdate(
      { name: 'Hardware & Embedded Labs' },
      { name: 'Hardware & Embedded Labs', description: 'Microcontrollers, sensors, and scopes' },
      { upsert: true, new: true }
    );

    // 2. Create items referencing categories
    await DemoItem.deleteMany({});
    const items = await DemoItem.insertMany([
      {
        title: 'Structure and Interpretation of Computer Programs',
        type: 'book',
        category: catTech._id,
        quantity: 4,
        finePerDay: 3
      },
      {
        title: 'Digital Storage Oscilloscope 50MHz',
        type: 'equipment',
        category: catLab._id,
        quantity: 2,
        finePerDay: 15
      }
    ]);

    // 3. Read back with populate
    const populated = await DemoItem.find().populate('category', 'name description');

    res.status(201).json({
      success: true,
      message: 'Mongoose Schemas, Validation, InsertMany and .populate() successfully demonstrated!',
      populated
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
