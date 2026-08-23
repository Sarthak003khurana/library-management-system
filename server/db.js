// ============================================
// DB.JS - Firestore persistence layer
// ============================================
//
// ResourceHub now uses Firebase Firestore
// instead of the local server/data/db.json file.
//
// The API keeps the same basic method names:
//   db.get()
//   db.find()
//   db.findOne()
//   db.findById()
//   db.insert()
//   db.update()
//   db.remove()
//
// IMPORTANT:
// All database operations are asynchronous.
// Routes using these methods must use await.
// ============================================

const admin = require('firebase-admin');

// Initialize Firebase Admin
require('./firebase');

const firestore = admin.firestore();


// ============================================
// COLLECTION REFERENCE
// ============================================

function collectionRef(collection) {
  return firestore.collection(collection);
}


// ============================================
// DATABASE OBJECT
// ============================================

const db = {

  // ------------------------------------------
  // GET ALL DOCUMENTS
  // ------------------------------------------

  async get(collection) {

    const snapshot =
      await collectionRef(collection).get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },


  // ------------------------------------------
  // FIND DOCUMENTS
  // ------------------------------------------

  async find(collection, predicate) {

    const documents =
      await this.get(collection);

    return documents.filter(predicate);
  },


  // ------------------------------------------
  // FIND ONE DOCUMENT
  // ------------------------------------------

  async findOne(collection, predicate) {

    const documents =
      await this.get(collection);

    return documents.find(predicate);
  },


  // ------------------------------------------
  // FIND BY ID
  // ------------------------------------------

  async findById(collection, id) {

    const doc =
      await collectionRef(collection)
        .doc(id)
        .get();

    if (!doc.exists) {
      return undefined;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  },


  // ------------------------------------------
  // INSERT DOCUMENT
  // ------------------------------------------

  async insert(collection, document) {

    if (!document || !document.id) {

      throw new Error(
        'Document must contain an id'
      );
    }

    await collectionRef(collection)
      .doc(document.id)
      .set(document);

    return document;
  },


  // ------------------------------------------
  // UPDATE DOCUMENT
  // ------------------------------------------

  async update(collection, id, patch) {

    const ref =
      collectionRef(collection).doc(id);

    const existing =
      await ref.get();

    if (!existing.exists) {
      return null;
    }

    await ref.update(patch);

    const updated =
      await ref.get();

    return {
      id: updated.id,
      ...updated.data()
    };
  },


  // ------------------------------------------
  // REMOVE DOCUMENT
  // ------------------------------------------

  async remove(collection, id) {

    const ref =
      collectionRef(collection).doc(id);

    const existing =
      await ref.get();

    if (!existing.exists) {
      return false;
    }

    await ref.delete();

    return true;
  },


  // ------------------------------------------
  // RELOAD
  // ------------------------------------------
  //
  // No local cache is used anymore.
  // Firestore always provides the current data.
  // ------------------------------------------

  async reload() {
    return true;
  }

};


module.exports = db;