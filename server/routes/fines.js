// ============================================
// FINES ROUTES - view and pay fines
//
// Firestore version
// All database operations are asynchronous.
// ============================================

const express = require('express');

const db = require('../db');

const { requireAuth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

const router = express.Router();

const ADMIN_ROLES = ['admin', 'lab_manager'];


// ============================================
// GET ALL FINES
// ============================================
//
// GET /api/fines
//
// Normal users:
//   → See only their own fines
//
// Admin / Lab Manager:
//   → Can use ?all=true to see all fines
// ============================================

router.get(
  '/',
  requireAuth,
  async (req, res) => {

    try {

      const all =
        req.query.all === 'true' &&
        ADMIN_ROLES.includes(req.user.role);


      // Firestore db.get() is asynchronous
      const fines =
        await db.get('fines');


      let list = fines;


      // ----------------------------------------
      // Normal users only see their own fines
      // ----------------------------------------

      if (!all) {

        list =
          list.filter(
            fine =>
              fine.userId === req.user.id
          );

      }


      // ----------------------------------------
      // Sort newest fines first
      // ----------------------------------------

      list.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );


      res.json(list);

    }
    catch (error) {

      console.error(
        'Get fines error:',
        error
      );


      res.status(500).json({

        message:
          'Could not load fines'

      });

    }

  }
);


// ============================================
// PAY FINE
// ============================================
//
// POST /api/fines/:id/pay
//
// User can pay their own fine.
// Admin / Lab Manager can pay any fine.
// ============================================

router.post(
  '/:id/pay',
  requireAuth,
  async (req, res) => {

    try {

      // ----------------------------------------
      // Find fine
      // ----------------------------------------

      const fine =
        await db.findById(
          'fines',
          req.params.id
        );


      if (!fine) {

        return res.status(404).json({

          message:
            'Fine not found'

        });

      }


      // ----------------------------------------
      // Check authorization
      // ----------------------------------------

      const isOwner =
        fine.userId ===
        req.user.id;


      const isAdminRole =
        ADMIN_ROLES.includes(
          req.user.role
        );


      if (
        !isOwner &&
        !isAdminRole
      ) {

        return res.status(403).json({

          message:
            'You can only pay your own fines'

        });

      }


      // ----------------------------------------
      // Prevent paying an already-paid fine
      // ----------------------------------------

      if (fine.paid === true) {

        return res.status(409).json({

          message:
            'This fine has already been paid'

        });

      }


      // ----------------------------------------
      // Update fine
      // ----------------------------------------

      const updated =
        await db.update(
          'fines',
          fine.id,
          {
            paid: true,
            paidAt:
              new Date().toISOString()
          }
        );


      if (!updated) {

        return res.status(404).json({

          message:
            'Fine not found'

        });

      }


      res.json(updated);

    }
    catch (error) {

      console.error(
        'Pay fine error:',
        error
      );


      res.status(500).json({

        message:
          'Could not process fine payment'

      });

    }

  }
);


// ============================================
// EXPORT ROUTER
// ============================================

module.exports = router;