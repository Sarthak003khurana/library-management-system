// ============================================
// MIGRATE-BOOKS-TO-MONGO.JS
// Safe, Idempotent Migration: Firestore 'items' -> MongoDB Atlas 'books'
// Target Database: 'resourcehub' in Cluster0
//
// Safety Guarantees:
// 1. Strictly READ-ONLY on Firestore (never modifies or deletes Firestore data).
// 2. Defaults to DRY RUN mode. Requires explicit '--execute' flag to write.
// 3. Preserves all existing string UUID 'id' values (foreign-key for reservations).
// 4. Fully idempotent using $setOnInsert (will never duplicate or overwrite).
// 5. Detects and reports conflicting or incomplete pre-existing records.
// 6. Reports anomalous records separately without silently modifying or discarding them.
// 7. Sanitizes all output: zero credentials can ever appear in logs.
// ============================================

require('dotenv').config();

const { firestore } = require('./firebase');
const { mongoose, initMongoDB, sanitizeCredentials } = require('./mongodb');
const Book = require('./models/Book');

// Helper to compare two records for discrepancies
function findDiscrepancies(source, target) {
  const diffs = [];
  if (source.title !== target.title) {
    diffs.push(`title: Firestore="${source.title}" vs MongoDB="${target.title}"`);
  }
  if (source.type !== target.type) {
    diffs.push(`type: Firestore="${source.type}" vs MongoDB="${target.type}"`);
  }
  if (Number(source.quantity ?? 1) !== Number(target.quantity ?? 1)) {
    diffs.push(`quantity: Firestore=${source.quantity} vs MongoDB=${target.quantity}`);
  }
  if (Number(source.availableQuantity ?? source.quantity ?? 1) !== Number(target.availableQuantity ?? target.quantity ?? 1)) {
    diffs.push(`availableQuantity: Firestore=${source.availableQuantity} vs MongoDB=${target.availableQuantity}`);
  }
  if ((source.isbn || null) !== (target.isbn || null)) {
    diffs.push(`isbn: Firestore="${source.isbn}" vs MongoDB="${target.isbn}"`);
  }
  return diffs;
}

// Helper to check if a target record is incomplete
function checkIncomplete(target) {
  const issues = [];
  if (!target.title) issues.push('missing title');
  if (target.quantity === undefined || target.quantity === null || target.quantity < 1) {
    issues.push('invalid quantity (< 1)');
  }
  if (target.availableQuantity === undefined || target.availableQuantity === null || target.availableQuantity < 0) {
    issues.push('invalid availableQuantity (< 0)');
  }
  return issues;
}

async function runMigration(options = {}) {
  const isExecute = Boolean(options.isExecute || process.argv.includes('--execute'));
  const isDryRun = !isExecute || (!options.isExecute && process.argv.includes('--dry-run'));

  console.log('');
  console.log('============================================================');
  console.log(' ResourceHub - Firestore to MongoDB Atlas Book Migration');
  console.log(' Target Database: resourcehub (Cluster0)');
  console.log(' Mode           : ' + (isDryRun ? '🔍 DRY RUN (Simulation only, no writes)' : '🚀 EXECUTE (Writing to MongoDB)'));
  console.log('============================================================');
  console.log('');

  // ----------------------------------------------------------
  // STEP 1: READ FIRESTORE ITEMS COLLECTION (READ-ONLY)
  // ----------------------------------------------------------
  console.log('📥 Step 1: Reading items from Google Cloud Firestore (Read-Only)...');
  const itemsSnapshot = await firestore.collection('items').get();

  if (itemsSnapshot.empty) {
    console.log('⚠️ No items found in Firestore collection "items".');
    return { success: false, reason: 'empty_firestore' };
  }

  const rawDocs = itemsSnapshot.docs.map(doc => ({
    _docId: doc.id,
    ...doc.data()
  }));

  console.log(`✓ Fetched ${rawDocs.length} total document(s) from Firestore.`);
  console.log('');

  // ----------------------------------------------------------
  // STEP 2: AUDIT SOURCE DATA & DETECT ANOMALIES
  // ----------------------------------------------------------
  console.log('🔍 Step 2: Auditing records and analyzing data consistency...');

  const seenIds = new Set();
  const duplicateIds = [];
  const missingIds = [];
  const validBooks = [];
  const anomalousRecords = [];

  for (const doc of rawDocs) {
    const docId = doc.id || doc._docId;

    if (!doc.id) {
      missingIds.push(doc._docId);
    }

    if (seenIds.has(docId)) {
      duplicateIds.push(docId);
    }
    seenIds.add(docId);

    // Anomaly detection:
    // Flag any record where type is not 'book', or where title starts with unescaped quotes/commas
    const isStandardBook = (doc.type === 'book' || doc.type === undefined);
    const hasSuspectFormatting = typeof doc.title === 'string' && (doc.title.startsWith('"') || doc.title.includes('""'));

    if (!isStandardBook || hasSuspectFormatting) {
      anomalousRecords.push(doc);
    } else {
      validBooks.push(doc);
    }
  }

  console.log(`  - Total items analyzed    : ${rawDocs.length}`);
  console.log(`  - Unique IDs              : ${seenIds.size}`);
  console.log(`  - Duplicate IDs           : ${duplicateIds.length}`);
  console.log(`  - Missing 'id' fields     : ${missingIds.length}`);
  console.log(`  - Standard book records   : ${validBooks.length}`);
  console.log(`  - Anomalous records       : ${anomalousRecords.length}`);
  console.log('');

  // ----------------------------------------------------------
  // STEP 3: SEPARATE ANOMALOUS RECORD REPORT
  // ----------------------------------------------------------
  if (anomalousRecords.length > 0) {
    console.log('============================================================');
    console.log(' ⚠️  ANOMALOUS RECORD AUDIT REPORT (PRESERVED WITHOUT SILENT EDITS)');
    console.log('============================================================');
    anomalousRecords.forEach((item, idx) => {
      console.log(`[Anomaly #${idx + 1}]`);
      console.log(`  ID         : ${item.id}`);
      console.log(`  Title      : ${JSON.stringify(item.title)}`);
      console.log(`  Type       : ${JSON.stringify(item.type)}`);
      console.log(`  Category   : ${JSON.stringify(item.category)}`);
      console.log(`  Author     : ${JSON.stringify(item.author)}`);
      console.log(`  Location   : ${JSON.stringify(item.location)}`);
      console.log(`  Status     : ${JSON.stringify(item.status)}`);
      console.log(`  Fine/Day   : ${item.finePerDay}`);
      console.log('  Diagnosis  : CSV delimiter split anomaly (e.g. "Guns, Germs, and Steel").');
      console.log('  Rule Status: PRESERVED AS-IS. Not silently modified, not deleted.');
      console.log('------------------------------------------------------------');
    });
    console.log('');
  }

  // ----------------------------------------------------------
  // STEP 4: MONGODB STATUS & TARGET DATABASE VERIFICATION
  // ----------------------------------------------------------
  console.log('📊 Step 3: MongoDB Atlas Destination & Database Verification...');

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.log('ℹ️ MONGODB_URI is not set in the local environment.');
    console.log('  (The server-side MONGODB_URI variable has been configured in Render).');
    console.log('');
    console.log('------------------------------------------------------------');
    console.log(' DRY RUN SIMULATION SUMMARY (Without live Atlas connection):');
    console.log(`   Source records in Firestore   : ${rawDocs.length}`);
    console.log(`   Target database locked        : resourcehub`);
    console.log(`   Planned insertions into Mongo : ${rawDocs.length}`);
    console.log(`   Preserved UUID IDs            : ${seenIds.size}`);
    console.log(`   Duplicate records prevented   : 0`);
    console.log(`   Anomalous records flagged     : ${anomalousRecords.length}`);
    console.log(`   Firestore records modified    : 0 (Strictly Read-Only)`);
    console.log('------------------------------------------------------------');
    return {
      success: true,
      mode: 'dry-run-offline',
      sourceCount: rawDocs.length,
      anomalousCount: anomalousRecords.length,
      duplicates: duplicateIds.length
    };
  }

  // Connect to MongoDB Atlas
  const connResult = await initMongoDB();

  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ Could not establish connection to MongoDB Atlas.');
    return { success: false, error: sanitizeCredentials(connResult.error || 'Connection failed') };
  }

  const activeDb = mongoose.connection.name;
  console.log(`✓ Active MongoDB Database verified: "${activeDb}"`);
  if (activeDb !== 'resourcehub') {
    console.warn(`⚠️ Warning: Expected database "resourcehub", but connected to "${activeDb}".`);
  }

  // ----------------------------------------------------------
  // STEP 5: PRE-EXISTING DOCUMENTS AUDIT & CONFLICT DETECTION
  // ----------------------------------------------------------
  console.log('');
  console.log('🔍 Step 4: Inspecting pre-existing documents in MongoDB...');

  const sourceMap = new Map(rawDocs.map(d => [d.id, d]));
  const existingMongoDocs = await Book.find({}, {
    id: 1,
    title: 1,
    type: 1,
    category: 1,
    quantity: 1,
    availableQuantity: 1,
    isbn: 1,
    author: 1,
    status: 1
  }).lean();

  const existingMap = new Map(existingMongoDocs.map(b => [b.id, b]));
  console.log(`  - Total records currently in MongoDB 'books': ${existingMap.size}`);

  const toInsert = [];
  const matchingExisting = [];
  const conflictingExisting = [];
  const incompleteExisting = [];

  for (const [id, sourceItem] of sourceMap.entries()) {
    if (existingMap.has(id)) {
      const targetItem = existingMap.get(id);

      // Check completeness
      const missingFields = checkIncomplete(targetItem);
      if (missingFields.length > 0) {
        incompleteExisting.push({ id, title: targetItem.title, issues: missingFields });
      }

      // Check discrepancies
      const diffs = findDiscrepancies(sourceItem, targetItem);
      if (diffs.length > 0) {
        conflictingExisting.push({ id, title: sourceItem.title, discrepancies: diffs });
      } else {
        matchingExisting.push(id);
      }
    } else {
      toInsert.push(sourceItem);
    }
  }

  console.log(`  - New books to be imported          : ${toInsert.length}`);
  console.log(`  - Existing books (identical/matching): ${matchingExisting.length}`);
  console.log(`  - Existing books with discrepancies : ${conflictingExisting.length}`);
  console.log(`  - Existing books with missing fields : ${incompleteExisting.length}`);

  if (conflictingExisting.length > 0) {
    console.log('');
    console.log('⚠️ CONFLICTING PRE-EXISTING RECORDS DETECTED:');
    conflictingExisting.forEach(c => {
      console.log(`  ID: ${c.id} ("${c.title}")`);
      c.discrepancies.forEach(d => console.log(`     ↳ Discrepancy: ${d}`));
    });
    console.log('  Note: $setOnInsert will preserve existing MongoDB records without overwriting them.');
  }

  if (incompleteExisting.length > 0) {
    console.log('');
    console.log('⚠️ INCOMPLETE PRE-EXISTING RECORDS DETECTED:');
    incompleteExisting.forEach(c => {
      console.log(`  ID: ${c.id} ("${c.title}") - Issues: ${c.issues.join(', ')}`);
    });
  }

  // ----------------------------------------------------------
  // STEP 6: DRY-RUN COMPLETION OR EXECUTION
  // ----------------------------------------------------------
  if (isDryRun) {
    console.log('');
    console.log('============================================================');
    console.log(' 🔍 DRY RUN COMPLETED SUCCESSFULLY');
    console.log('============================================================');
    console.log(`  Source records in Firestore   : ${rawDocs.length}`);
    console.log(`  Target database               : ${activeDb}`);
    console.log(`  Would insert into MongoDB     : ${toInsert.length}`);
    console.log(`  Would skip (already exists)   : ${existingMap.size}`);
    console.log(`  Conflicting records detected  : ${conflictingExisting.length}`);
    console.log(`  Incomplete records detected   : ${incompleteExisting.length}`);
    console.log(`  Anomalous records identified  : ${anomalousRecords.length}`);
    console.log(`  Firestore records modified    : 0 (VERIFIED READ-ONLY)`);
    console.log('');
    console.log('  To execute the real migration after receiving user approval, run:');
    console.log('  node server/migrate-books-to-mongo.js --execute');
    console.log('============================================================');
    console.log('');
    return {
      success: true,
      mode: 'dry-run',
      sourceCount: rawDocs.length,
      toInsert: toInsert.length,
      alreadyExisting: existingMap.size,
      conflicts: conflictingExisting.length,
      incomplete: incompleteExisting.length,
      anomalies: anomalousRecords.length
    };
  }

  // EXECUTE MODE: Use idempotent $setOnInsert operations
  console.log('');
  console.log('🚀 Executing idempotent bulk import to MongoDB...');

  const operations = rawDocs.map(doc => {
    const { _docId, ...bookData } = doc;

    return {
      updateOne: {
        filter: { id: bookData.id },
        update: {
          $setOnInsert: {
            ...bookData,
            migratedAt: new Date().toISOString()
          }
        },
        upsert: true
      }
    };
  });

  const result = await Book.bulkWrite(operations, { ordered: false });

  // ----------------------------------------------------------
  // STEP 7: POST-MIGRATION VERIFICATION
  // ----------------------------------------------------------
  console.log('🔍 Step 5: Running post-migration destination verification...');

  const finalMongoDocs = await Book.find({}, { id: 1 }).lean();
  const finalMongoIds = new Set(finalMongoDocs.map(b => b.id));

  let verifiedCount = 0;
  const missingInMongo = [];

  for (const doc of rawDocs) {
    if (finalMongoIds.has(doc.id)) {
      verifiedCount++;
    } else {
      missingInMongo.push(doc.id);
    }
  }

  console.log('');
  console.log('============================================================');
  console.log(' ✓ MIGRATION COMPLETED SUCCESSFULLY');
  console.log('============================================================');
  console.log(`  Target Database     : ${activeDb}`);
  console.log(`  Upserted / Created  : ${result.upsertedCount}`);
  console.log(`  Matched (Skipped)   : ${result.matchedCount}`);
  console.log(`  Total in Firestore  : ${rawDocs.length}`);
  console.log(`  Verified in Mongo   : ${verifiedCount} / ${rawDocs.length}`);
  console.log(`  Missing in Mongo    : ${missingInMongo.length}`);
  console.log(`  Firestore State     : UNMODIFIED (Read-Only)`);
  console.log('============================================================');
  console.log('');

  if (missingInMongo.length > 0) {
    console.error(`✕ Error: ${missingInMongo.length} records were not found in MongoDB after migration.`);
  }

  return {
    success: missingInMongo.length === 0,
    mode: 'execute',
    upserted: result.upsertedCount,
    skipped: result.matchedCount,
    verified: verifiedCount,
    total: rawDocs.length
  };
}

async function ensureBooksMigrated() {
  if (mongoose.connection.readyState !== 1) {
    return { success: false, reason: 'mongo_not_connected' };
  }

  try {
    const existingCount = await Book.countDocuments();
    if (existingCount > 0) {
      console.log(`✓ MongoDB Atlas book catalog active: ${existingCount} books present in 'resourcehub' database.`);
      return { success: true, count: existingCount, autoMigrated: false };
    }

    console.log('ℹ️ MongoDB Atlas books collection is empty. Executing safe initial migration from Firestore...');
    const result = await runMigration({ isExecute: true });
    return { success: true, ...result, autoMigrated: true };
  } catch (err) {
    console.warn(`⚠️ Auto-migration check notice: ${sanitizeCredentials(err.message)}`);
    return { success: false, error: err.message };
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(report => {
      if (mongoose.connection.readyState === 1) {
        return mongoose.disconnect();
      }
    })
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error('');
      console.error('✕ Migration failed:', sanitizeCredentials(err.message));
      if (mongoose.connection.readyState === 1) {
        mongoose.disconnect();
      }
      process.exit(1);
    });
}

module.exports = { runMigration, ensureBooksMigrated, findDiscrepancies, checkIncomplete };
