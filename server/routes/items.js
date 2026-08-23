// ============================================
// ITEMS ROUTES - Firestore catalog CRUD
// + ISBN autofill
// + Quantity management
// + Smart bulk CSV import
// ============================================
//
// QUANTITY SYSTEM
//
// quantity          = total physical copies
// availableQuantity = copies currently available
//
// Example:
// quantity: 10
// availableQuantity: 9
//
// Means 9 out of 10 copies are available.
//
// CSV behavior:
//
// 1. quantity column exists
//    -> use supplied quantity
//
// 2. quantity column does not exist
//    -> every unique book starts with quantity 1
//
// 3. Duplicate ISBN
//    -> merge into one item
//
// 4. No ISBN, duplicate title
//    -> merge into one item
//
// 5. Duplicate rows with quantities
//    -> quantities are added together
//
// ============================================

const express = require('express');
const crypto = require('crypto');

const {
  firestore
} = require('../firebase');

const {
  requireAuth
} = require('../middleware/auth');

const {
  allowRoles
} = require('../middleware/rbac');

const router = express.Router();

const ADMIN_ROLES = [
  'admin',
  'lab_manager'
];


// ============================================
// FIRESTORE COLLECTION
// ============================================

const itemsCollection =
  firestore.collection('items');


// ============================================
// HELPER - NORMALIZE TEXT
// ============================================

function normalizeText(value) {

  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

}


// ============================================
// HELPER - CONVERT QUANTITY
// ============================================

function parseQuantity(value, fallback = 1) {

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallback;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return fallback;
  }

  return Math.floor(number);

}


// ============================================
// HELPER - GET SAFE QUANTITY
// ============================================

function getItemQuantity(item) {

  const quantity =
    parseQuantity(
      item.quantity,
      1
    );

  const available =
    parseQuantity(
      item.availableQuantity,
      quantity
    );

  return {
    quantity,
    availableQuantity:
      Math.min(
        quantity,
        available
      )
  };

}


// ============================================
// GET ALL ITEMS
// ============================================
//
// GET /api/items
//
// Optional:
// ?type=book
// ?category=Computer Science
// ?status=available
// ?q=algorithm
//
// ============================================

router.get(
  '/',
  requireAuth,
  async (req, res) => {

    try {

      const {
        type,
        category,
        status,
        q
      } = req.query;


      // ----------------------------------------
      // Get all items
      // ----------------------------------------

      const snapshot =
        await itemsCollection.get();


      let items =
        snapshot.docs.map(
          doc => {

            const item =
              doc.data();

            const {
              quantity,
              availableQuantity
            } =
              getItemQuantity(item);


            return {
              ...item,

              quantity,

              availableQuantity
            };

          }
        );


      // ----------------------------------------
      // Filter by type
      // ----------------------------------------

      if (type) {

        items =
          items.filter(
            item =>
              item.type === type
          );

      }


      // ----------------------------------------
      // Filter by category
      // ----------------------------------------

      if (category) {

        items =
          items.filter(
            item =>
              item.category === category
          );

      }


      // ----------------------------------------
      // Filter by status
      // ----------------------------------------

      if (status) {

        items =
          items.filter(
            item =>
              item.status === status
          );

      }


      // ----------------------------------------
      // Search
      // ----------------------------------------

      if (q) {

        const query =
          q.toLowerCase();


        items =
          items.filter(
            item =>

              (item.title || '')
                .toLowerCase()
                .includes(query)

              ||

              (item.author || '')
                .toLowerCase()
                .includes(query)

              ||

              (item.category || '')
                .toLowerCase()
                .includes(query)

              ||

              (item.isbn || '')
                .toLowerCase()
                .includes(query)

          );

      }


      return res.json(items);

    }

    catch (error) {

      console.error(
        'Get items error:',
        error
      );


      return res.status(500).json({
        message:
          'Failed to retrieve items'
      });

    }

  }
);


// ============================================
// GET SINGLE ITEM
// ============================================
//
// GET /api/items/:id
//
// ============================================

router.get(
  '/:id',
  requireAuth,
  async (req, res) => {

    try {

      const itemSnapshot =
        await itemsCollection
          .doc(req.params.id)
          .get();


      if (
        !itemSnapshot.exists
      ) {

        return res.status(404).json({
          message:
            'Item not found'
        });

      }


      const item =
        itemSnapshot.data();


      const {
        quantity,
        availableQuantity
      } =
        getItemQuantity(item);


      return res.json({

        ...item,

        quantity,

        availableQuantity

      });

    }

    catch (error) {

      console.error(
        'Get item error:',
        error
      );


      return res.status(500).json({
        message:
          'Failed to retrieve item'
      });

    }

  }
);


// ============================================
// ISBN LOOKUP
// ============================================
//
// GET /api/items/lookup/isbn/:isbn
//
// Admin + Lab Manager only
//
// ============================================

router.get(
  '/lookup/isbn/:isbn',
  requireAuth,
  allowRoles(...ADMIN_ROLES),
  async (req, res) => {

    const {
      isbn
    } = req.params;


    try {

      const response =
        await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
        );


      if (
        !response.ok
      ) {

        throw new Error(
          'Open Library request failed'
        );

      }


      const data =
        await response.json();


      const book =
        data[
          `ISBN:${isbn}`
        ];


      if (!book) {

        return res.status(404).json({
          message:
            'No book found for this ISBN'
        });

      }


      return res.json({

        title:
          book.title,

        author:
          (book.authors || [])
            .map(
              author =>
                author.name
            )
            .join(', '),

        coverUrl:
          book.cover
            ? book.cover.medium
            : null,

        isbn

      });

    }

    catch (error) {

      console.error(
        'ISBN lookup error:',
        error
      );


      return res.status(502).json({
        message:
          'Could not reach Open Library. Enter details manually.'
      });

    }

  }
);


// ============================================
// CREATE ITEM
// ============================================
//
// POST /api/items
//
// Admin + Lab Manager only
//
// ============================================

router.post(
  '/',
  requireAuth,
  allowRoles(...ADMIN_ROLES),
  async (req, res) => {

    try {

      const {
        title,
        type,
        category,
        location,
        finePerDay,
        isbn,
        author,
        coverUrl,
        quantity
      } = req.body;


      // ----------------------------------------
      // Validate required fields
      // ----------------------------------------

      if (
        !title ||
        !type ||
        !category
      ) {

        return res.status(400).json({
          message:
            'title, type, and category are required'
        });

      }


      // ----------------------------------------
      // Quantity
      // ----------------------------------------

      const totalQuantity =
        parseQuantity(
          quantity,
          1
        );


      if (
        totalQuantity < 1
      ) {

        return res.status(400).json({
          message:
            'Quantity must be at least 1'
        });

      }


      // ----------------------------------------
      // Create item
      // ----------------------------------------

      const item = {

        id:
          crypto.randomUUID(),

        title:
          String(title).trim(),

        type,

        category:
          String(category).trim(),

        status:
          'available',

        location:
          location ||
          'Unassigned',

        finePerDay:
          Number(finePerDay) ||
          (
            type === 'book'
              ? 3
              : 10
          ),

        isbn:
          isbn ||
          null,

        author:
          author ||
          null,

        coverUrl:
          coverUrl ||
          null,

        // --------------------------------------
        // QUANTITY
        // --------------------------------------

        quantity:
          totalQuantity,

        availableQuantity:
          totalQuantity,

        conditionRating:
          10,

        createdAt:
          new Date().toISOString()

      };


      // ----------------------------------------
      // Store in Firestore
      // ----------------------------------------

      await itemsCollection
        .doc(item.id)
        .set(item);


      console.log(
        `✓ Item created: ${item.title} (${totalQuantity} copies)`
      );


      return res.status(201).json(item);

    }

    catch (error) {

      console.error(
        'Create item error:',
        error
      );


      return res.status(500).json({
        message:
          'Failed to create item'
      });

    }

  }
);


// ============================================
// UPDATE ITEM
// ============================================
//
// PUT /api/items/:id
//
// Admin + Lab Manager only
//
// Quantity behavior:
//
// Existing:
// total = 10
// available = 7
// borrowed = 3
//
// Manager changes total to 15:
//
// total = 15
// available = 12
//
// The 3 borrowed copies remain borrowed.
//
// ============================================

router.put(
  '/:id',
  requireAuth,
  allowRoles(...ADMIN_ROLES),
  async (req, res) => {

    try {

      const itemRef =
        itemsCollection
          .doc(req.params.id);


      const itemSnapshot =
        await itemRef.get();


      if (
        !itemSnapshot.exists
      ) {

        return res.status(404).json({
          message:
            'Item not found'
        });

      }


      const existingItem =
        itemSnapshot.data();


      // ----------------------------------------
      // Prevent changing ID
      // ----------------------------------------

      const {
        id,
        quantity,
        availableQuantity,
        ...updates
      } = req.body;


      // ========================================
      // QUANTITY CALCULATION
      // ========================================

      const oldTotal =
        parseQuantity(
          existingItem.quantity,
          1
        );


      const oldAvailable =
        Math.min(

          oldTotal,

          parseQuantity(
            existingItem.availableQuantity,
            oldTotal
          )

        );


      // ----------------------------------------
      // Determine new total
      // ----------------------------------------

      let newTotal;


      if (
        quantity !== undefined &&
        quantity !== null &&
        quantity !== ''
      ) {

        newTotal =
          parseQuantity(
            quantity,
            oldTotal
          );

      }

      else {

        newTotal =
          oldTotal;

      }


      if (
        newTotal < 1
      ) {

        return res.status(400).json({
          message:
            'Quantity must be at least 1'
        });

      }


      // ----------------------------------------
      // Calculate currently borrowed copies
      // ----------------------------------------

      const borrowedCopies =
        Math.max(
          0,
          oldTotal -
          oldAvailable
        );


      // ----------------------------------------
      // New available quantity
      // ----------------------------------------

      let newAvailable =
        newTotal -
        borrowedCopies;


      // ----------------------------------------
      // Prevent invalid quantity
      // ----------------------------------------

      if (
        newAvailable < 0
      ) {

        return res.status(400).json({
          message:
            `Cannot reduce total quantity below ${borrowedCopies} currently borrowed copies`
        });

      }


      newAvailable =
        Math.min(
          newTotal,
          newAvailable
        );


      // ----------------------------------------
      // Determine status
      // ----------------------------------------

      let newStatus =
        updates.status ||
        existingItem.status;


      if (
        existingItem.type === 'book'
      ) {

        if (
          newAvailable > 0
        ) {

          newStatus =
            updates.status === 'maintenance'
              ? 'maintenance'
              : 'available';

        }

        else {

          newStatus =
            'borrowed';

        }

      }


      // ========================================
      // BUILD UPDATED ITEM
      // ========================================

      const updatedItem = {

        ...existingItem,

        ...updates,

        id:
          existingItem.id,

        quantity:
          newTotal,

        availableQuantity:
          newAvailable,

        status:
          newStatus,

        updatedAt:
          new Date().toISOString()

      };


      // ----------------------------------------
      // Keep fine at ₹3/day for books
      // when no fine is supplied.
      // ----------------------------------------

      if (
        updatedItem.type === 'book'
      ) {

        if (
          updatedItem.finePerDay ===
            undefined ||
          updatedItem.finePerDay ===
            null ||
          updatedItem.finePerDay === ''
        ) {

          updatedItem.finePerDay =
            3;

        }

      }


      // ----------------------------------------
      // Store updated item
      // ----------------------------------------

      await itemRef.set(
        updatedItem
      );


      console.log(
        `✓ Item updated: ${updatedItem.title}`
      );


      return res.json(
        updatedItem
      );

    }

    catch (error) {

      console.error(
        'Update item error:',
        error
      );


      return res.status(500).json({
        message:
          'Failed to update item'
      });

    }

  }
);


// ============================================
// DELETE ITEM
// ============================================
//
// DELETE /api/items/:id
//
// ============================================

router.delete(
  '/:id',
  requireAuth,
  allowRoles(...ADMIN_ROLES),
  async (req, res) => {

    try {

      const itemRef =
        itemsCollection
          .doc(req.params.id);


      const itemSnapshot =
        await itemRef.get();


      if (
        !itemSnapshot.exists
      ) {

        return res.status(404).json({
          message:
            'Item not found'
        });

      }


      await itemRef.delete();


      console.log(
        `✓ Item deleted: ${req.params.id}`
      );


      return res.status(204).end();

    }

    catch (error) {

      console.error(
        'Delete item error:',
        error
      );


      return res.status(500).json({
        message:
          'Failed to delete item'
      });

    }

  }
);


// ============================================
// BULK IMPORT
// ============================================
//
// POST /api/items/bulk-import
//
// Smart quantity handling.
//
// ============================================

router.post(
  '/bulk-import',
  requireAuth,
  allowRoles(...ADMIN_ROLES),
  async (req, res) => {

    try {

      const rows =
        req.body.items;


      if (
        !Array.isArray(rows)
      ) {

        return res.status(400).json({
          message:
            'items must be an array'
        });

      }


      if (
        rows.length === 0
      ) {

        return res.status(400).json({
          message:
            'No items supplied for import'
        });

      }


      // ========================================
      // GROUP DUPLICATES
      // ========================================

      const grouped =
        new Map();


      for (
        const row of rows
      ) {

        if (
          !row ||
          !row.title ||
          !String(row.title).trim()
        ) {

          continue;

        }


        const title =
          String(
            row.title
          ).trim();


        const isbn =
          row.isbn
            ? String(
                row.isbn
              ).trim()
            : '';


        const normalizedTitle =
          normalizeText(
            title
          );


        // --------------------------------------
        // Prefer ISBN for matching.
        //
        // If ISBN does not exist, use title.
        // --------------------------------------

        const key =
          isbn
            ? `isbn:${normalizeText(isbn)}`
            : `title:${normalizedTitle}`;


        const rowQuantity =
          parseQuantity(
            row.quantity,
            1
          );


        if (
          grouped.has(key)
        ) {

          const existing =
            grouped.get(key);


          // ------------------------------------
          // Add duplicate quantity
          // ------------------------------------

          existing.quantity +=
            rowQuantity;


          // ------------------------------------
          // Fill missing information
          // ------------------------------------

          if (
            !existing.author &&
            row.author
          ) {

            existing.author =
              row.author;

          }


          if (
            !existing.category &&
            row.category
          ) {

            existing.category =
              row.category;

          }


          if (
            !existing.location &&
            row.location
          ) {

            existing.location =
              row.location;

          }


          if (
            !existing.isbn &&
            row.isbn
          ) {

            existing.isbn =
              row.isbn;

          }

        }

        else {

          grouped.set(
            key,
            {

              ...row,

              title,

              quantity:
                rowQuantity

            }
          );

        }

      }


      // ========================================
      // CREATE FIRESTORE BATCH
      // ========================================

      const batch =
        firestore.batch();


      const created = [];


      for (
        const row of grouped.values()
      ) {

        const totalQuantity =
          Math.max(
            1,
            parseQuantity(
              row.quantity,
              1
            )
          );


        const item = {

          id:
            crypto.randomUUID(),

          title:
            String(
              row.title
            ).trim(),

          type:
            row.type ||
            'book',

          category:
            row.category ||
            'General',

          status:
            'available',

          location:
            row.location ||
            'Unassigned',

          finePerDay:
            Number(
              row.finePerDay
            ) ||
            (
              row.type === 'equipment'
                ? 10
                : 3
            ),

          isbn:
            row.isbn ||
            null,

          author:
            row.author ||
            null,

          coverUrl:
            row.coverUrl ||
            null,

          quantity:
            totalQuantity,

          availableQuantity:
            totalQuantity,

          conditionRating:
            10,

          createdAt:
            new Date().toISOString()

        };


        const itemRef =
          itemsCollection
            .doc(item.id);


        batch.set(
          itemRef,
          item
        );


        created.push(item);

      }


      // ========================================
      // COMMIT
      // ========================================

      await batch.commit();


      console.log(
        `✓ Bulk imported ${created.length} unique items`
      );


      return res.status(201).json({

        importedCount:
          created.length,

        items:
          created

      });

    }

    catch (error) {

      console.error(
        'Bulk import error:',
        error
      );


      return res.status(500).json({
        message:
          'Failed to import items'
      });

    }

  }
);


// ============================================
// EXPORT ROUTER
// ============================================

module.exports = router;