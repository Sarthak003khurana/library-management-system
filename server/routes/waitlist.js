// ============================================
// WAITLIST ROUTES - smart priority queue
//
// Covers:
// - sort
// - map
// - filter
// - reduce
// - destructuring
// - Firestore async operations
// ============================================

const express = require('express');
const crypto = require('crypto');

const db = require('../db');

const { requireAuth } = require('../middleware/auth');

const {
  calculatePriority
} = require('../utils/priorityAlgorithm');

const router = express.Router();


// ============================================
// ENRICH WAITLIST ENTRY
// ============================================
//
// Adds:
// - itemTitle
// - userName
// - priorityScore
// - priority breakdown
//
// IMPORTANT:
// Firestore db methods are asynchronous,
// therefore this function must be async.
// ============================================

async function enrich(entry) {

  const item =
    await db.findById(
      'items',
      entry.itemId
    );


  const user =
    await db.findById(
      'users',
      entry.userId
    );


  const {
    score,
    breakdown
  } = calculatePriority({

    userRole:
      user?.role,

    reliabilityScore:
      user?.reliabilityScore,

    urgency:
      entry.urgency,

    requestedAt:
      entry.requestedAt

  });


  return {

    ...entry,

    itemTitle:
      item
        ? item.title
        : 'Unknown item',

    userName:
      user
        ? user.name
        : 'Unknown user',

    priorityScore:
      score,

    breakdown

  };

}


// ============================================
// GET WAITLIST
// ============================================
//
// GET /api/waitlist
//
// Returns the complete waitlist sorted by
// priority score.
//
// ============================================

router.get(
  '/',
  requireAuth,
  async (req, res) => {

    try {

      // ----------------------------------------
      // Get waitlist from Firestore
      // ----------------------------------------

      const entries =
        await db.get(
          'waitlist'
        );


      // ----------------------------------------
      // Enrich each entry
      //
      // Promise.all is required because enrich()
      // is asynchronous.
      // ----------------------------------------

      const enriched =
        await Promise.all(
          entries.map(
            entry =>
              enrich(entry)
          )
        );


      // ----------------------------------------
      // Sort by highest priority first
      // ----------------------------------------

      const list =
        enriched.sort(
          (a, b) =>
            b.priorityScore -
            a.priorityScore
        );


      // ----------------------------------------
      // Attach queue position per item
      // ----------------------------------------

      const positionByItem = {};


      list.forEach(
        entry => {

          positionByItem[entry.itemId] =
            (
              positionByItem[entry.itemId] ||
              0
            ) + 1;


          entry.position =
            positionByItem[
              entry.itemId
            ];

        }
      );


      res.json(list);

    }
    catch (error) {

      console.error(
        'Get waitlist error:',
        error
      );


      res.status(500).json({

        message:
          'Could not load waitlist'

      });

    }

  }
);


// ============================================
// ADD TO WAITLIST
// ============================================
//
// POST /api/waitlist
//
// Body:
// {
//   itemId,
//   urgency
// }
//
// ============================================

router.post(
  '/',
  requireAuth,
  async (req, res) => {

    try {

      const {
        itemId,
        urgency = 'normal'
      } = req.body;


      // ----------------------------------------
      // Validate item ID
      // ----------------------------------------

      if (!itemId) {

        return res.status(400).json({

          message:
            'itemId is required'

        });

      }


      // ----------------------------------------
      // Check item
      // ----------------------------------------

      const item =
        await db.findById(
          'items',
          itemId
        );


      if (!item) {

        return res.status(404).json({

          message:
            'Item not found'

        });

      }


      // ----------------------------------------
      // Check duplicate waitlist entry
      // ----------------------------------------

      const already =
        await db.findOne(
          'waitlist',
          entry =>
            entry.itemId === itemId &&
            entry.userId === req.user.id
        );


      if (already) {

        return res.status(409).json({

          message:
            'You are already on the waitlist for this item'

        });

      }


      // ----------------------------------------
      // Create waitlist entry
      // ----------------------------------------

      const entry = {

        id:
          crypto.randomUUID(),

        itemId,

        userId:
          req.user.id,

        urgency,

        requestedAt:
          new Date().toISOString(),

        notified:
          false

      };


      const created =
        await db.insert(
          'waitlist',
          entry
        );


      // ----------------------------------------
      // Enrich created entry
      // ----------------------------------------

      const enriched =
        await enrich(created);


      res
        .status(201)
        .json(enriched);

    }
    catch (error) {

      console.error(
        'Create waitlist error:',
        error
      );


      res.status(500).json({

        message:
          'Could not add item to waitlist'

      });

    }

  }
);


// ============================================
// DELETE WAITLIST ENTRY
// ============================================
//
// DELETE /api/waitlist/:id
//
// Users can delete their own entry.
//
// Admin and Lab Manager can delete any entry.
// ============================================

router.delete(
  '/:id',
  requireAuth,
  async (req, res) => {

    try {

      // ----------------------------------------
      // Find waitlist entry
      // ----------------------------------------

      const entry =
        await db.findById(
          'waitlist',
          req.params.id
        );


      if (!entry) {

        return res.status(404).json({

          message:
            'Waitlist entry not found'

        });

      }


      // ----------------------------------------
      // Authorization
      // ----------------------------------------

      const isOwner =
        entry.userId ===
        req.user.id;


      const isAdminRole =
        [
          'admin',
          'lab_manager'
        ].includes(
          req.user.role
        );


      if (
        !isOwner &&
        !isAdminRole
      ) {

        return res.status(403).json({

          message:
            'You can only cancel your own waitlist request'

        });

      }


      // ----------------------------------------
      // Remove entry
      // ----------------------------------------

      const removed =
        await db.remove(
          'waitlist',
          req.params.id
        );


      if (!removed) {

        return res.status(404).json({

          message:
            'Waitlist entry not found'

        });

      }


      res
        .status(204)
        .end();

    }
    catch (error) {

      console.error(
        'Delete waitlist error:',
        error
      );


      res.status(500).json({

        message:
          'Could not remove waitlist entry'

      });

    }

  }
);


// ============================================
// EXPORT
// ============================================

module.exports = router;