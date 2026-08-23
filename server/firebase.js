// ============================================
// FIREBASE.JS - Firebase Admin + Firestore
// Central Firebase configuration for backend
// Supports local development and production
// deployment through environment variables.
// ============================================

const admin = require('firebase-admin');

// ============================================
// INITIALIZE FIREBASE ADMIN
// ============================================

if (!admin.apps.length) {
  try {
    let credential;

    // --------------------------------------------
    // PRODUCTION / DEPLOYMENT
    // --------------------------------------------
    // Render and other hosting platforms can store
    // the Firebase service-account JSON in an
    // environment variable.
    //
    // FIREBASE_SERVICE_ACCOUNT should contain the
    // complete JSON service-account object.
    // --------------------------------------------

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount =
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      credential = admin.credential.cert(serviceAccount);
    }

    // --------------------------------------------
    // LOCAL DEVELOPMENT
    // --------------------------------------------
    // If FIREBASE_SERVICE_ACCOUNT is not provided,
    // use the local firebase-service-account.json.
    // --------------------------------------------

    else {
      const path = require('path');

      const serviceAccountPath = path.join(
        __dirname,
        '..',
        'firebase-service-account.json'
      );

      credential = admin.credential.cert(
        require(serviceAccountPath)
      );
    }

    // --------------------------------------------
    // Initialize Firebase
    // --------------------------------------------

    admin.initializeApp({
      credential
    });

    console.log(
      '✓ Firebase Admin initialized successfully'
    );

  } catch (error) {
    console.error(
      '✕ Firebase Admin initialization failed:'
    );

    console.error(error.message);

    throw error;
  }
}

// ============================================
// FIREBASE SERVICES
// ============================================

const firebaseAuth = admin.auth();

const firestore = admin.firestore();

// ============================================
// EXPORT
// ============================================

module.exports = {
  admin,
  firebaseAuth,
  firestore
};