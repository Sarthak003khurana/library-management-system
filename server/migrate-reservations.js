// ============================================
// MIGRATE-RESERVATIONS.JS
// Migrates reservations from db.json -> Firestore
// ============================================

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load Firebase Admin configuration.
// firebase.js initializes Firebase Admin.
require('./firebase');


// ============================================
// FIRESTORE
// ============================================

const firestore = admin.firestore();

const reservationsCollection =
  firestore.collection('reservations');


// ============================================
// LOCAL DB FILE
// ============================================

const DATA_FILE =
  path.join(__dirname, 'data', 'db.json');


// ============================================
// MAIN MIGRATION
// ============================================

async function migrateReservations() {

  console.log('\n============================================');
  console.log(' ResourceHub - Reservations Migration');
  console.log(' db.json -> Firestore');
  console.log('============================================\n');


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


  const reservations =
    Array.isArray(data.reservations)
      ? data.reservations
      : [];


  console.log(
    `Found ${reservations.length} reservation(s) in db.json.\n`
  );


  if (reservations.length === 0) {

    console.log(
      'No reservations found. Nothing to migrate.'
    );

    return;
  }


  let imported = 0;
  let skipped = 0;


  // ==========================================
  // MIGRATE EACH RESERVATION
  // ==========================================

  for (const reservation of reservations) {

    try {

      if (!reservation.id) {

        console.log(
          '✕ Skipped reservation without an ID'
        );

        skipped++;
        continue;
      }


      // ----------------------------------------
      // Check whether reservation already exists
      // ----------------------------------------

      const existingDoc =
        await reservationsCollection
          .doc(reservation.id)
          .get();


      if (existingDoc.exists) {

        console.log(
          `↷ Skipped existing reservation: ${reservation.id}`
        );

        skipped++;
        continue;
      }


      // ----------------------------------------
      // Create Firestore document
      // ----------------------------------------
      //
      // We preserve the existing reservation ID
      // so userId/itemId relationships remain
      // exactly the same as db.json.
      // ----------------------------------------

      await reservationsCollection
        .doc(reservation.id)
        .set({

          id:
            reservation.id,

          itemId:
            reservation.itemId || null,

          userId:
            reservation.userId || null,

          userName:
            reservation.userName || null,

          itemType:
            reservation.itemType || null,

          startDate:
            reservation.startDate || null,

          endDate:
            reservation.endDate || null,

          dueDate:
            reservation.dueDate || null,

          borrowedAt:
            reservation.borrowedAt || null,

          returnedAt:
            reservation.returnedAt || null,

          status:
            reservation.status || 'active',

          conditionBefore:
            reservation.conditionBefore ?? null,

          conditionAfter:
            reservation.conditionAfter ?? null,

          fineCalculated:
            Number(reservation.fineCalculated || 0),

          damageDescription:
            reservation.damageDescription || null
        });


      console.log(
        `✓ Imported reservation: ${reservation.id}`
      );

      imported++;

    } catch (error) {

      console.error(
        `✕ Failed reservation ${reservation.id}:`,
        error.message
      );

      skipped++;
    }
  }


  // ==========================================
  // SUMMARY
  // ==========================================

  console.log('\n============================================');
  console.log(' Migration Complete');
  console.log('============================================');

  console.log(
    `Imported : ${imported}`
  );

  console.log(
    `Skipped  : ${skipped}`
  );

  console.log(
    `Total    : ${reservations.length}`
  );

  console.log('============================================\n');
}


// ============================================
// RUN
// ============================================

migrateReservations()
  .then(() => {

    console.log(
      '✓ Reservations migration finished successfully.'
    );

    process.exit(0);

  })
  .catch(error => {

    console.error(
      '\n✕ Reservations migration failed:'
    );

    console.error(error);

    process.exit(1);
  });