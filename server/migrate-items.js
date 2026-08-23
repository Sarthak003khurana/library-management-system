// ============================================
// MIGRATE-ITEMS.JS
// One-time migration:
// db.json -> Firebase Firestore
//
// Existing item IDs are preserved.
// Existing Firestore items are skipped.
// ============================================

const fs = require('fs');
const path = require('path');

const {
  firestore
} = require('./firebase');


// ============================================
// FILE LOCATION
// ============================================

const DATA_FILE =
  path.join(
    __dirname,
    'data',
    'db.json'
  );


// ============================================
// FIRESTORE COLLECTION
// ============================================

const itemsCollection =
  firestore.collection('items');


// ============================================
// MIGRATION
// ============================================

async function migrateItems() {

  console.log('');
  console.log(
    '============================================'
  );
  console.log(
    ' ResourceHub - Items Migration'
  );
  console.log(
    ' db.json -> Firestore'
  );
  console.log(
    '============================================'
  );
  console.log('');


  // ------------------------------------------
  // Check db.json
  // ------------------------------------------

  if (!fs.existsSync(DATA_FILE)) {

    throw new Error(
      `db.json not found at: ${DATA_FILE}`
    );

  }


  // ------------------------------------------
  // Read db.json
  // ------------------------------------------

  const raw =
    fs.readFileSync(
      DATA_FILE,
      'utf-8'
    );


  const data =
    JSON.parse(raw);


  const items =
    Array.isArray(data.items)
      ? data.items
      : [];


  if (items.length === 0) {

    console.log(
      'No items found in db.json.'
    );

    return;

  }


  console.log(
    `Found ${items.length} item(s) in db.json.`
  );

  console.log('');


  let importedCount = 0;
  let skippedCount = 0;


  // ==========================================
  // MIGRATE EACH ITEM
  // ==========================================

  for (
    const item of items
  ) {

    if (!item.id) {

      console.log(
        '⚠ Skipping item without an ID:',
        item.title
      );

      skippedCount++;

      continue;

    }


    const itemRef =
      itemsCollection.doc(
        item.id
      );


    // ----------------------------------------
    // Check whether item already exists
    // ----------------------------------------

    const existing =
      await itemRef.get();


    if (existing.exists) {

      console.log(
        `↷ Skipped existing item: ${item.title}`
      );

      skippedCount++;

      continue;

    }


    // ----------------------------------------
    // Preserve existing item exactly
    // ----------------------------------------

    const firestoreItem = {

      id:
        item.id,

      title:
        item.title || '',

      type:
        item.type || 'book',

      category:
        item.category || 'General',

      status:
        item.status || 'available',

      location:
        item.location || 'Unassigned',

      finePerDay:
        Number(
          item.finePerDay
        ) || 2,

      isbn:
        item.isbn || null,

      author:
        item.author || null,

      coverUrl:
        item.coverUrl || null,

      conditionRating:
        Number(
          item.conditionRating
        ) || 10,

      migratedAt:
        new Date().toISOString()

    };


    // ----------------------------------------
    // Write to Firestore
    // ----------------------------------------

    await itemRef.set(
      firestoreItem
    );


    console.log(
      `✓ Imported: ${item.title}`
    );


    importedCount++;

  }


  // ==========================================
  // SUMMARY
  // ==========================================

  console.log('');

  console.log(
    '============================================'
  );

  console.log(
    ' Migration Complete'
  );

  console.log(
    '============================================'
  );

  console.log(
    `Imported : ${importedCount}`
  );

  console.log(
    `Skipped  : ${skippedCount}`
  );

  console.log(
    `Total    : ${items.length}`
  );

  console.log(
    '============================================'
  );

  console.log('');

}


// ============================================
// RUN
// ============================================

migrateItems()
  .then(() => {

    console.log(
      '✓ Items migration finished successfully.'
    );

    process.exit(0);

  })
  .catch(error => {

    console.error('');
    console.error(
      '✕ Items migration failed:'
    );
    console.error(
      error
    );

    process.exit(1);

  });