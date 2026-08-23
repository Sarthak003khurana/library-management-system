// ============================================
// FIREBASE.JS - Firebase Admin + Firestore
// Central Firebase configuration for backend
// ============================================

const path = require('path');
const admin = require('firebase-admin');


// ============================================
// SERVICE ACCOUNT
// ============================================

const serviceAccountPath = path.join(
  __dirname,
  '..',
  'firebase-service-account.json'
);


// ============================================
// INITIALIZE FIREBASE ADMIN
// ============================================

if (!admin.apps.length) {

  try {

    admin.initializeApp({
      credential: admin.credential.cert(
        require(serviceAccountPath)
      )
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