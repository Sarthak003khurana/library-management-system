// ============================================
// MIGRATE-USERS.JS
// Migrates users from db.json -> Firestore
// ============================================

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase Admin
require('./firebase');


// ============================================
// FIRESTORE
// ============================================

const firestore = admin.firestore();

const usersCollection =
  firestore.collection('users');


// ============================================
// LOCAL DB FILE
// ============================================

const DATA_FILE =
  path.join(__dirname, 'data', 'db.json');


// ============================================
// MAIN MIGRATION
// ============================================

async function migrateUsers() {

  console.log('\n============================================');
  console.log(' ResourceHub - Users Migration');
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


  const users =
    Array.isArray(data.users)
      ? data.users
      : [];


  console.log(
    `Found ${users.length} user(s) in db.json.\n`
  );


  if (users.length === 0) {

    console.log(
      'No users found. Nothing to migrate.'
    );

    return;
  }


  let imported = 0;
  let skipped = 0;


  // ==========================================
  // MIGRATE EACH USER
  // ==========================================

  for (const user of users) {

    try {

      // ----------------------------------------
      // Validate ID
      // ----------------------------------------

      if (!user.id) {

        console.log(
          '✕ Skipped user without an ID'
        );

        skipped++;
        continue;
      }


      // ----------------------------------------
      // Check whether this exact user already
      // exists in Firestore.
      // ----------------------------------------

      const existingDoc =
        await usersCollection
          .doc(user.id)
          .get();


      if (existingDoc.exists) {

        console.log(
          `↷ Skipped existing user: ${user.email}`
        );

        skipped++;
        continue;
      }


      // ----------------------------------------
      // Build Firestore user document
      // ----------------------------------------
      //
      // We preserve the existing ID so that
      // reservations continue pointing to the
      // correct user.
      //
      // Password is preserved for the existing
      // email/password accounts because it is
      // already bcrypt-hashed.
      //
      // Google-specific fields are included only
      // when they exist.
      // ----------------------------------------

      const firestoreUser = {

        id:
          user.id,

        name:
          user.name || 'User',

        email:
          user.email || '',

        role:
          user.role || 'student',

        reliabilityScore:
          user.reliabilityScore ?? 75,

        createdAt:
          user.createdAt ||
          new Date().toISOString()
      };


      // ----------------------------------------
      // Preserve bcrypt password when available
      // ----------------------------------------

      if (user.password) {

        firestoreUser.password =
          user.password;
      }


      // ----------------------------------------
      // Preserve Firebase / Google information
      // ----------------------------------------

      if (user.firebaseUid) {

        firestoreUser.firebaseUid =
          user.firebaseUid;
      }


      if (user.photoURL) {

        firestoreUser.photoURL =
          user.photoURL;
      }


      if (user.authProvider) {

        firestoreUser.authProvider =
          user.authProvider;
      }


      // ----------------------------------------
      // Write to Firestore
      // ----------------------------------------

      await usersCollection
        .doc(user.id)
        .set(firestoreUser);


      console.log(
        `✓ Imported user: ${user.name} (${user.email})`
      );

      imported++;

    } catch (error) {

      console.error(
        `✕ Failed user ${user.email || user.id}:`,
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
    `Total    : ${users.length}`
  );

  console.log('============================================\n');
}


// ============================================
// RUN
// ============================================

migrateUsers()
  .then(() => {

    console.log(
      '✓ Users migration finished successfully.'
    );

    process.exit(0);

  })
  .catch(error => {

    console.error(
      '\n✕ Users migration failed:'
    );

    console.error(error);

    process.exit(1);
  });