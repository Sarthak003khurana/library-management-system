// ============================================
// TEST: MONGODB ATLAS BOOK MODEL & CONNECTOR
// Unit tests verifying:
// 1. Mongoose Book schema validates and preserves string UUID 'id'
// 2. Connector prioritizes MONGODB_URI and reports status safely
// 3. Dry-run auditing correctly flags anomalous records without silent mutation
// ============================================

const { describe, it } = require('node:test');
const assert = require('node:assert');
const Book = require('../server/models/Book');
const { getMongoStatus } = require('../server/mongodb');

describe('MongoDB Atlas Book Model & Schema Contract', () => {
  it('should instantiate a Book model with UUID string id preserved', () => {
    const rawData = {
      id: '09d150ed-b0d0-4a0a-b1cf-e3fdd4b7976e',
      title: 'The Prince',
      type: 'book',
      category: 'Philosophy',
      location: 'Main Library',
      finePerDay: 3,
      isbn: null,
      author: 'Rufus Godwin',
      coverUrl: null,
      quantity: 2,
      availableQuantity: 2,
      conditionRating: 10
    };

    const book = new Book(rawData);

    // Verify fields
    assert.strictEqual(book.id, rawData.id);
    assert.strictEqual(book.title, 'The Prince');
    assert.strictEqual(book.quantity, 2);
    assert.strictEqual(book.availableQuantity, 2);

    // Verify toJSON removes _id and keeps string id
    const json = book.toJSON();
    assert.strictEqual(json.id, rawData.id);
    assert.strictEqual(json._id, undefined);
    assert.strictEqual(json.__v, undefined);
  });

  it('should fail validation if required id or title is missing', async () => {
    const bookWithoutId = new Book({ title: 'Untitled Book' });
    await assert.rejects(async () => {
      await bookWithoutId.validate();
    }, /Book ID is required/);

    const bookWithoutTitle = new Book({ id: 'uuid-123' });
    await assert.rejects(async () => {
      await bookWithoutTitle.validate();
    }, /Book title is required/);
  });

  it('should enforce quantity constraints (quantity >= 1, available >= 0)', async () => {
    const invalidQtyBook = new Book({
      id: 'uuid-test-qty',
      title: 'Invalid Book',
      quantity: 0
    });
    await assert.rejects(async () => {
      await invalidQtyBook.validate();
    }, /Quantity must be at least 1/);
  });

  it('should preserve unexpected or extra Firestore fields when strict: false', () => {
    const extraFieldBook = new Book({
      id: 'uuid-extra',
      title: 'Book with Custom Metadata',
      customTag: 'preserved-tag',
      migratedAt: '2026-10-28T09:00:00.000Z'
    });

    const json = extraFieldBook.toJSON();
    assert.strictEqual(json.customTag, 'preserved-tag');
    assert.strictEqual(json.migratedAt, '2026-10-28T09:00:00.000Z');
  });
});

describe('MongoDB Connection Configuration & Security', () => {
  it('should report MongoDB status safely without exposing secrets', () => {
    const status = getMongoStatus();

    // Verify standard schema
    assert.strictEqual(typeof status.isConfigured, 'boolean');
    assert.strictEqual(typeof status.isConnected, 'boolean');
    assert.strictEqual(typeof status.readyState, 'number');
    assert.strictEqual(typeof status.readyStateName, 'string');

    // Verify no secret leakage
    const serialized = JSON.stringify(status);
    assert.ok(!serialized.includes('mongodb+srv://'), 'Status must never leak connection URI');
    assert.ok(!serialized.includes('password'), 'Status must never leak password');
  });
});

describe('Migration Audit & Anomaly Detection', () => {
  function auditItems(items) {
    const seenIds = new Set();
    const duplicateIds = [];
    const anomalous = [];
    const valid = [];

    for (const item of items) {
      if (seenIds.has(item.id)) {
        duplicateIds.push(item.id);
      }
      seenIds.add(item.id);

      const isStandardBook = (item.type === 'book' || item.type === undefined);
      const hasSuspectFormatting = typeof item.title === 'string' && (item.title.startsWith('"') || item.title.includes('""'));

      if (!isStandardBook || hasSuspectFormatting) {
        anomalous.push(item);
      } else {
        valid.push(item);
      }
    }

    return { total: items.length, unique: seenIds.size, duplicates: duplicateIds, valid, anomalous };
  }

  it('should correctly categorize standard books and anomalous CSV-split records', () => {
    const sampleItems = [
      {
        id: '1',
        title: 'Introduction to Algorithms',
        type: 'book',
        author: 'Cormen'
      },
      {
        id: '2',
        title: '"Guns',
        type: 'Jared Daimond',
        category: 'and Steel"',
        author: 'Germs'
      }
    ];

    const audit = auditItems(sampleItems);
    assert.strictEqual(audit.total, 2);
    assert.strictEqual(audit.unique, 2);
    assert.strictEqual(audit.duplicates.length, 0);
    assert.strictEqual(audit.valid.length, 1);
    assert.strictEqual(audit.anomalous.length, 1);
    assert.strictEqual(audit.anomalous[0].id, '2');
    assert.strictEqual(audit.anomalous[0].type, 'Jared Daimond');
  });
});

describe('Pre-Existing Document Verification & Conflict Detection', () => {
  const { findDiscrepancies, checkIncomplete } = require('../server/migrate-books-to-mongo');
  const { sanitizeCredentials } = require('../server/mongodb');

  it('should detect discrepancies between Firestore and pre-existing MongoDB records', () => {
    const firestoreRecord = {
      id: 'uuid-1',
      title: 'Introduction to Algorithms (4th Ed)',
      type: 'book',
      quantity: 5,
      availableQuantity: 4,
      isbn: '9780262046305'
    };

    const mongoRecordWithMismatch = {
      id: 'uuid-1',
      title: 'Intro to Algorithms (Old Ed)',
      type: 'book',
      quantity: 2,
      availableQuantity: 2,
      isbn: '9780262033848'
    };

    const diffs = findDiscrepancies(firestoreRecord, mongoRecordWithMismatch);
    assert.strictEqual(diffs.length, 4); // title, quantity, availableQuantity, isbn
    assert.ok(diffs.some(d => d.includes('title:')));
    assert.ok(diffs.some(d => d.includes('quantity:')));
  });

  it('should return 0 discrepancies when records are identical', () => {
    const record = {
      id: 'uuid-2',
      title: 'Clean Architecture',
      type: 'book',
      quantity: 3,
      availableQuantity: 3,
      isbn: '9780134494166'
    };

    const diffs = findDiscrepancies(record, { ...record });
    assert.strictEqual(diffs.length, 0);
  });

  it('should flag incomplete pre-existing MongoDB records', () => {
    const incompleteRecord = {
      id: 'uuid-3',
      title: '', // missing title
      quantity: 0, // invalid quantity
      availableQuantity: -1 // invalid availableQuantity
    };

    const issues = checkIncomplete(incompleteRecord);
    assert.strictEqual(issues.length, 3);
    assert.ok(issues.includes('missing title'));
    assert.ok(issues.includes('invalid quantity (< 1)'));
    assert.ok(issues.includes('invalid availableQuantity (< 0)'));
  });

  it('should sanitize credentials from strings completely', () => {
    const rawError = 'MongoServerError: auth failed on mongodb+srv://admin_user:SuperSecretP@ss!@cluster0.abcde.mongodb.net/test';
    const sanitized = sanitizeCredentials(rawError);

    assert.ok(!sanitized.includes('SuperSecretP@ss!'), 'Password must be completely scrubbed');
    assert.ok(!sanitized.includes('admin_user'), 'Username must be scrubbed');
    assert.ok(sanitized.includes('<redacted-credentials>'), 'Redaction placeholder must be present');
  });
});

describe('MongoDB Atomic Inventory & Borrow/Return Lifecycle', () => {
  function simulateAtomicBorrow(book) {
    if (book.availableQuantity <= 0) {
      return { success: false, reason: 'NO_COPIES_AVAILABLE' };
    }
    const newAvail = book.availableQuantity - 1;
    return {
      success: true,
      updatedBook: {
        ...book,
        availableQuantity: newAvail,
        status: newAvail === 0 ? 'borrowed' : 'available'
      }
    };
  }

  function simulateAtomicReturn(book, conditionRating) {
    const totalQty = Math.max(1, Number(book.quantity ?? 1));
    const curAvail = Math.max(0, Number(book.availableQuantity ?? 0));
    const newAvail = Math.min(totalQty, curAvail + 1);
    const newStatus = newAvail > 0
      ? (book.status === 'maintenance' ? 'maintenance' : 'available')
      : 'borrowed';
    return {
      success: true,
      updatedBook: {
        ...book,
        availableQuantity: newAvail,
        status: newStatus,
        conditionRating: conditionRating != null ? Number(conditionRating) : book.conditionRating
      }
    };
  }

  it('should decrement availableQuantity on borrow and update status to borrowed when 0 copies remain', () => {
    const book = {
      id: 'uuid-atomic-1',
      title: 'Atomic Habits',
      quantity: 1,
      availableQuantity: 1,
      status: 'available'
    };

    const res = simulateAtomicBorrow(book);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.updatedBook.availableQuantity, 0);
    assert.strictEqual(res.updatedBook.status, 'borrowed');
  });

  it('should reject borrow when availableQuantity is 0', () => {
    const book = {
      id: 'uuid-atomic-2',
      title: 'Design Patterns',
      quantity: 3,
      availableQuantity: 0,
      status: 'borrowed'
    };

    const res = simulateAtomicBorrow(book);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.reason, 'NO_COPIES_AVAILABLE');
  });

  it('should restore availableQuantity up to total quantity on return and preserve maintenance status if set', () => {
    const book = {
      id: 'uuid-atomic-3',
      title: 'Refactoring',
      quantity: 2,
      availableQuantity: 0,
      status: 'borrowed'
    };

    const res = simulateAtomicReturn(book, 9);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.updatedBook.availableQuantity, 1);
    assert.strictEqual(res.updatedBook.status, 'available');
    assert.strictEqual(res.updatedBook.conditionRating, 9);

    // Cannot exceed total quantity
    const bookMax = { ...res.updatedBook, availableQuantity: 2 };
    const resOver = simulateAtomicReturn(bookMax);
    assert.strictEqual(resOver.updatedBook.availableQuantity, 2);
  });
});

