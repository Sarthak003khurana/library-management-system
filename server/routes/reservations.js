// ============================================
// RESERVATIONS ROUTES - Firestore version
// ============================================
//
// Covers:
// - Book borrowing
// - Book quantity management
// - Equipment time-slot booking
// - Conflict detection
// - Returns
// - Cancellations
// - Condition-based fines
// - Reliability score
//
// BOOK QUANTITY SYSTEM:
// quantity          = total physical copies
// availableQuantity = currently available copies
//
// Example:
// quantity: 10
// availableQuantity: 9
//
// Means:
// 9 out of 10 copies are available.
//
// ============================================

const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');

const {
  requireAuth
} = require('../middleware/auth');

const {
  calculateLateFee,
  calculateConditionFine
} = require('../utils/fineCalculator');

const router = express.Router();

const ADMIN_ROLES = [
  'admin',
  'lab_manager'
];

const BOOK_LOAN_DAYS = 14;


// ============================================
// FIRESTORE
// ============================================

const firestore =
  admin.firestore();

const reservationsCollection =
  firestore.collection('reservations');

const itemsCollection =
  firestore.collection('items');

const usersCollection =
  firestore.collection('users');

const finesCollection =
  firestore.collection('fines');


// ============================================
// HELPERS
// ============================================

function rangesOverlap(
  aStart,
  aEnd,
  bStart,
  bEnd
) {
  return (
    aStart <= bEnd &&
    bStart <= aEnd
  );
}


// ============================================
// GET ALL RESERVATIONS
//
// Normal users:
// → only their own reservations
//
// Admin / Lab Manager:
// → ?all=true gives all reservations
// ============================================

router.get(
  '/',
  requireAuth,
  async (req, res) => {

    try {

      const all =
        req.query.all === 'true' &&
        ADMIN_ROLES.includes(
          req.user.role
        );


      const snapshot =
        await reservationsCollection.get();


      let list =
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));


      // ----------------------------------------
      // Normal users only see their own records
      // ----------------------------------------

      if (!all) {

        list =
          list.filter(
            reservation =>
              reservation.userId ===
              req.user.id
          );

      }


      // ----------------------------------------
      // Add item title
      // ----------------------------------------

      const enriched =
        await Promise.all(

          list.map(
            async reservation => {

              const itemDoc =
                await itemsCollection
                  .doc(
                    reservation.itemId
                  )
                  .get();


              const item =
                itemDoc.exists
                  ? itemDoc.data()
                  : null;


              return {
                ...reservation,

                itemTitle:
                  item?.title ||
                  'Unknown item',

                // Include quantity information
                // when available.
                quantity:
                  item?.quantity ??
                  null,

                availableQuantity:
                  item?.availableQuantity ??
                  null

              };

            }
          )

        );


      // ----------------------------------------
      // Sort newest first
      // ----------------------------------------

      enriched.sort(
        (a, b) =>
          new Date(b.borrowedAt) -
          new Date(a.borrowedAt)
      );


      res.json(enriched);

    }

    catch (error) {

      console.error(
        'Get reservations error:',
        error
      );


      res.status(500).json({
        message:
          'Failed to load reservations'
      });

    }

  }
);


// ============================================
// CREATE RESERVATION
//
// POST /api/reservations
//
// Body:
//
// {
//   itemId,
//   startDate,
//   endDate
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
        startDate,
        endDate
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
      // Get item from Firestore
      // ----------------------------------------

      const itemDoc =
        await itemsCollection
          .doc(itemId)
          .get();


      if (!itemDoc.exists) {

        return res.status(404).json({
          message:
            'Item not found'
        });

      }


      const item = {
        id: itemDoc.id,
        ...itemDoc.data()
      };


      const now =
        new Date();

      let start =
        startDate
          ? new Date(startDate)
          : now;

      let end;


      // ========================================
      // BOOK RESERVATION
      // ========================================

      if (item.type === 'book') {

        // --------------------------------------
        // QUANTITY SYSTEM
        // --------------------------------------
        //
        // Old books that don't have quantity
        // fields are treated as having 1 copy.
        //
        // This keeps existing Firestore data
        // compatible.
        // --------------------------------------

        const totalQuantity =
          Number(
            item.quantity ?? 1
          );


        const availableQuantity =
          Number(
            item.availableQuantity ??
            totalQuantity
          );


        // --------------------------------------
        // Validate quantity
        // --------------------------------------

        if (
          !Number.isFinite(
            totalQuantity
          ) ||
          totalQuantity < 1
        ) {

          return res.status(409).json({
            message:
              'This book has no valid quantity configured. Please ask the library manager to set the quantity.'
          });

        }


        // --------------------------------------
        // No copies available
        // --------------------------------------

        if (
          !Number.isFinite(
            availableQuantity
          ) ||
          availableQuantity <= 0
        ) {

          return res.status(409).json({
            message:
              'No copies of this book are currently available. Please join the waitlist.'
          });

        }


        // --------------------------------------
        // Books always get 14 days
        // --------------------------------------

        start =
          now;

        end =
          new Date(
            now.getTime() +
            BOOK_LOAN_DAYS *
            86400000
          );

      }


      // ========================================
      // EQUIPMENT RESERVATION
      // ========================================

      else {

        if (
          !startDate ||
          !endDate
        ) {

          return res.status(400).json({
            message:
              'startDate and endDate are required for equipment bookings'
          });

        }


        start =
          new Date(startDate);

        end =
          new Date(endDate);


        // --------------------------------------
        // Validate dates
        // --------------------------------------

        if (
          Number.isNaN(
            start.getTime()
          ) ||
          Number.isNaN(
            end.getTime()
          )
        ) {

          return res.status(400).json({
            message:
              'Invalid startDate or endDate'
          });

        }


        if (end <= start) {

          return res.status(400).json({
            message:
              'endDate must be after startDate'
          });

        }


        // --------------------------------------
        // Check existing active reservations
        // --------------------------------------

        const reservationSnapshot =
          await reservationsCollection
            .where(
              'itemId',
              '==',
              itemId
            )
            .where(
              'status',
              '==',
              'active'
            )
            .get();


        const hasConflict =
          reservationSnapshot.docs.some(
            doc => {

              const existing =
                doc.data();


              const existingStart =
                new Date(
                  existing.startDate
                ).getTime();


              const existingEnd =
                new Date(
                  existing.endDate
                ).getTime();


              return rangesOverlap(
                start.getTime(),
                end.getTime(),
                existingStart,
                existingEnd
              );

            }
          );


        if (hasConflict) {

          return res.status(409).json({
            message:
              'This time slot conflicts with an existing booking'
          });

        }

      }


      // ========================================
      // CREATE RESERVATION
      // ========================================

      const reservationId =
        crypto.randomUUID();


      const reservation = {

        id:
          reservationId,

        itemId,

        userId:
          req.user.id,

        userName:
          req.user.name,

        itemType:
          item.type,

        startDate:
          start.toISOString(),

        endDate:
          end.toISOString(),

        dueDate:
          end.toISOString(),

        borrowedAt:
          now.toISOString(),

        returnedAt:
          null,

        status:
          'active',

        conditionBefore:
          item.conditionRating ??
          10,

        conditionAfter:
          null,

        fineCalculated:
          0

      };


      // ========================================
      // BOOK QUANTITY TRANSACTION
      // ========================================
      //
      // For books we use a Firestore transaction.
      //
      // This prevents two users from borrowing
      // the final copy at exactly the same time.
      //
      // Example:
      //
      // 1 available
      //
      // User A → gets the copy
      // User B → rejected
      //
      // ========================================

      if (item.type === 'book') {

        await firestore.runTransaction(
          async transaction => {

            const transactionItemRef =
              itemsCollection.doc(
                item.id
              );


            const latestItemDoc =
              await transaction.get(
                transactionItemRef
              );


            if (
              !latestItemDoc.exists
            ) {

              throw new Error(
                'Item not found'
              );

            }


            const latestItem =
              latestItemDoc.data();


            const totalQuantity =
              Number(
                latestItem.quantity ??
                1
              );


            const currentAvailable =
              Number(
                latestItem.availableQuantity ??
                totalQuantity
              );


            // ----------------------------------
            // Validate quantity
            // ----------------------------------

            if (
              !Number.isFinite(
                totalQuantity
              ) ||
              totalQuantity < 1
            ) {

              throw new Error(
                'INVALID_QUANTITY'
              );

            }


            // ----------------------------------
            // Check latest availability
            // ----------------------------------

            if (
              !Number.isFinite(
                currentAvailable
              ) ||
              currentAvailable <= 0
            ) {

              throw new Error(
                'NO_COPIES_AVAILABLE'
              );

            }


            const newAvailableQuantity =
              currentAvailable - 1;


            // ----------------------------------
            // Save reservation
            // ----------------------------------

            transaction.set(
              reservationsCollection.doc(
                reservationId
              ),
              reservation
            );


            // ----------------------------------
            // Update item quantity
            // ----------------------------------

            transaction.update(
              transactionItemRef,
              {

                quantity:
                  totalQuantity,

                availableQuantity:
                  newAvailableQuantity,

                // Keep status for compatibility
                status:
                  newAvailableQuantity === 0
                    ? 'borrowed'
                    : 'available'

              }
            );

          }
        );

      }


      // ========================================
      // EQUIPMENT RESERVATION
      // ========================================

      else {

        await reservationsCollection
          .doc(reservationId)
          .set(reservation);

      }


      // ========================================
      // RESPONSE
      // ========================================

      let response = {
        ...reservation
      };


      // Add current quantity information
      // for books.

      if (item.type === 'book') {

        const updatedItemDoc =
          await itemsCollection
            .doc(item.id)
            .get();


        if (
          updatedItemDoc.exists
        ) {

          const updatedItem =
            updatedItemDoc.data();


          response =
            {
              ...response,

              quantity:
                Number(
                  updatedItem.quantity ??
                  1
                ),

              availableQuantity:
                Number(
                  updatedItem.availableQuantity ??
                  0
                )

            };

        }

      }


      res.status(201).json(
        response
      );

    }

    catch (error) {

      console.error(
        'Create reservation error:',
        error
      );


      // --------------------------------------
      // Quantity-specific errors
      // --------------------------------------

      if (
        error.message ===
        'NO_COPIES_AVAILABLE'
      ) {

        return res.status(409).json({
          message:
            'No copies of this book are currently available. Please join the waitlist.'
        });

      }


      if (
        error.message ===
        'INVALID_QUANTITY'
      ) {

        return res.status(409).json({
          message:
            'This book has no valid quantity configured. Please ask the library manager to set the quantity.'
        });

      }


      if (
        error.message ===
        'Item not found'
      ) {

        return res.status(404).json({
          message:
            'Item not found'
        });

      }


      res.status(500).json({
        message:
          'Failed to create reservation'
      });

    }

  }
);


// ============================================
// RETURN RESERVATION
//
// POST /api/reservations/:id/return
// ============================================

router.post(
  '/:id/return',
  requireAuth,
  async (req, res) => {

    try {

      const reservationDoc =
        await reservationsCollection
          .doc(req.params.id)
          .get();


      if (
        !reservationDoc.exists
      ) {

        return res.status(404).json({
          message:
            'Reservation not found'
        });

      }


      const reservation = {
        id:
          reservationDoc.id,

        ...reservationDoc.data()
      };


      // ----------------------------------------
      // Only owner or admin/lab manager
      // ----------------------------------------

      if (
        reservation.userId !==
          req.user.id &&
        !ADMIN_ROLES.includes(
          req.user.role
        )
      ) {

        return res.status(403).json({
          message:
            'You can only return your own items'
        });

      }


      // ----------------------------------------
      // Must be active
      // ----------------------------------------

      if (
        reservation.status !==
        'active'
      ) {

        return res.status(409).json({
          message:
            'This reservation is not active'
        });

      }


      const {
        conditionRating,
        damageDescription
      } = req.body;


      // ----------------------------------------
      // Get item
      // ----------------------------------------

      const itemDoc =
        await itemsCollection
          .doc(
            reservation.itemId
          )
          .get();


      if (
        !itemDoc.exists
      ) {

        return res.status(404).json({
          message:
            'Item associated with this reservation was not found'
        });

      }


      const item = {
        id:
          itemDoc.id,

        ...itemDoc.data()
      };


      const returnedAt =
        new Date().toISOString();


      // ========================================
      // CALCULATE LATE FEE
      // ========================================

      const lateFee =
        calculateLateFee({

          dueDate:
            reservation.dueDate,

          returnedAt,

          dailyRate:
            item.finePerDay,

          graceDays:
            1,

          cap:
            item.finePerDay *
            25

        });


      // ========================================
      // CALCULATE CONDITION FINE
      // ========================================

      const conditionFine =
        conditionRating != null

          ? calculateConditionFine({

              ratingBefore:
                reservation.conditionBefore,

              ratingAfter:
                conditionRating

            })

          : 0;


      const totalFine =
        lateFee +
        conditionFine;


      // ========================================
      // UPDATE RESERVATION
      // ========================================

      await reservationsCollection
        .doc(reservation.id)
        .update({

          status:
            'completed',

          returnedAt,

          conditionAfter:
            conditionRating ??
            reservation.conditionBefore,

          fineCalculated:
            totalFine,

          damageDescription:
            damageDescription ||
            null

        });


      // ========================================
      // UPDATE ITEM
      // ========================================
      //
      // Books:
      // availableQuantity + 1
      //
      // Equipment:
      // status = available
      //
      // ========================================

      if (
        item.type === 'book'
      ) {

        await firestore.runTransaction(
          async transaction => {

            const transactionItemRef =
              itemsCollection.doc(
                item.id
              );


            const latestItemDoc =
              await transaction.get(
                transactionItemRef
              );


            if (
              !latestItemDoc.exists
            ) {

              throw new Error(
                'RETURN_ITEM_NOT_FOUND'
              );

            }


            const latestItem =
              latestItemDoc.data();


            const totalQuantity =
              Number(
                latestItem.quantity ??
                1
              );


            const currentAvailable =
              Number(
                latestItem.availableQuantity ??
                0
              );


            const newAvailableQuantity =
              Math.min(
                totalQuantity,
                currentAvailable + 1
              );


            transaction.update(
              transactionItemRef,
              {

                quantity:
                  totalQuantity,

                availableQuantity:
                  newAvailableQuantity,

                status:
                  newAvailableQuantity > 0
                    ? 'available'
                    : 'borrowed',

                conditionRating:
                  conditionRating != null
                    ? Number(
                        conditionRating
                      )
                    : latestItem.conditionRating

              }
            );

          }
        );

      }

      else {

        await itemsCollection
          .doc(item.id)
          .update({

            status:
              'available',

            conditionRating:
              conditionRating != null
                ? Number(
                    conditionRating
                  )
                : item.conditionRating

          });

      }


      // ========================================
      // CREATE FINE
      // ========================================

      if (
        totalFine > 0
      ) {

        const fineId =
          crypto.randomUUID();


        const reason =
          lateFee > 0 &&
          conditionFine > 0

            ? 'Late return + condition damage'

            : lateFee > 0

              ? 'Late return'

              : 'Condition damage';


        await finesCollection
          .doc(fineId)
          .set({

            id:
              fineId,

            userId:
              reservation.userId,

            reservationId:
              reservation.id,

            itemTitle:
              item.title,

            amount:
              totalFine,

            reason,

            paid:
              false,

            createdAt:
              new Date().toISOString()

          });

      }


      // ========================================
      // UPDATE RELIABILITY SCORE
      // ========================================

      const userDoc =
        await usersCollection
          .doc(
            reservation.userId
          )
          .get();


      if (
        userDoc.exists
      ) {

        const user =
          userDoc.data();


        const delta =
          totalFine > 0
            ? -5
            : 2;


        const currentScore =
          user.reliabilityScore ||
          75;


        const newScore =
          Math.max(

            0,

            Math.min(
              100,
              currentScore +
                delta
            )

          );


        await usersCollection
          .doc(
            reservation.userId
          )
          .update({

            reliabilityScore:
              newScore

          });

      }


      // ========================================
      // GET UPDATED ITEM QUANTITY
      // ========================================

      let availableQuantity =
        null;

      let quantity =
        null;


      if (
        item.type === 'book'
      ) {

        const updatedItemDoc =
          await itemsCollection
            .doc(item.id)
            .get();


        if (
          updatedItemDoc.exists
        ) {

          const updatedItem =
            updatedItemDoc.data();


          quantity =
            Number(
              updatedItem.quantity ??
              1
            );


          availableQuantity =
            Number(
              updatedItem.availableQuantity ??
              0
            );

        }

      }


      // ========================================
      // RESPONSE
      // ========================================

      res.json({

        message:
          'Item returned',

        lateFee,

        conditionFine,

        totalFine,

        quantity,

        availableQuantity

      });

    }

    catch (error) {

      console.error(
        'Return reservation error:',
        error
      );


      if (
        error.message ===
        'RETURN_ITEM_NOT_FOUND'
      ) {

        return res.status(404).json({
          message:
            'Item associated with this reservation was not found'
        });

      }


      res.status(500).json({
        message:
          'Failed to return item'
      });

    }

  }
);


// ============================================
// CANCEL RESERVATION
//
// POST /api/reservations/:id/cancel
// ============================================

router.post(
  '/:id/cancel',
  requireAuth,
  async (req, res) => {

    try {

      const reservationDoc =
        await reservationsCollection
          .doc(req.params.id)
          .get();


      if (
        !reservationDoc.exists
      ) {

        return res.status(404).json({
          message:
            'Reservation not found'
        });

      }


      const reservation = {
        id:
          reservationDoc.id,

        ...reservationDoc.data()
      };


      // ----------------------------------------
      // Owner or admin/lab manager only
      // ----------------------------------------

      if (
        reservation.userId !==
          req.user.id &&
        !ADMIN_ROLES.includes(
          req.user.role
        )
      ) {

        return res.status(403).json({
          message:
            'You can only cancel your own reservations'
        });

      }


      // ----------------------------------------
      // Must be active
      // ----------------------------------------

      if (
        reservation.status !==
        'active'
      ) {

        return res.status(409).json({
          message:
            'This reservation is not active'
        });

      }


      // ========================================
      // GET ITEM
      // ========================================

      const itemDoc =
        await itemsCollection
          .doc(
            reservation.itemId
          )
          .get();


      if (
        !itemDoc.exists
      ) {

        return res.status(404).json({
          message:
            'Item associated with this reservation was not found'
        });

      }


      const item =
        itemDoc.data();


      // ========================================
      // CANCEL RESERVATION + RESTORE QUANTITY
      // ========================================

      if (
        item.type === 'book'
      ) {

        await firestore.runTransaction(
          async transaction => {

            const reservationRef =
              reservationsCollection
                .doc(
                  reservation.id
                );


            const itemRef =
              itemsCollection
                .doc(
                  reservation.itemId
                );


            const latestReservationDoc =
              await transaction.get(
                reservationRef
              );


            if (
              !latestReservationDoc.exists
            ) {

              throw new Error(
                'RESERVATION_NOT_FOUND'
              );

            }


            const latestReservation =
              latestReservationDoc.data();


            if (
              latestReservation.status !==
              'active'
            ) {

              throw new Error(
                'RESERVATION_NOT_ACTIVE'
              );

            }


            const latestItemDoc =
              await transaction.get(
                itemRef
              );


            if (
              !latestItemDoc.exists
            ) {

              throw new Error(
                'ITEM_NOT_FOUND'
              );

            }


            const latestItem =
              latestItemDoc.data();


            const totalQuantity =
              Number(
                latestItem.quantity ??
                1
              );


            const currentAvailable =
              Number(
                latestItem.availableQuantity ??
                0
              );


            const newAvailableQuantity =
              Math.min(
                totalQuantity,
                currentAvailable + 1
              );


            // ----------------------------------
            // Cancel reservation
            // ----------------------------------

            transaction.update(
              reservationRef,
              {
                status:
                  'cancelled'
              }
            );


            // ----------------------------------
            // Restore book copy
            // ----------------------------------

            transaction.update(
              itemRef,
              {

                quantity:
                  totalQuantity,

                availableQuantity:
                  newAvailableQuantity,

                status:
                  newAvailableQuantity > 0
                    ? 'available'
                    : 'borrowed'

              }
            );

          }
        );

      }

      else {

        // --------------------------------------
        // Equipment cancellation
        // --------------------------------------

        await reservationsCollection
          .doc(
            reservation.id
          )
          .update({

            status:
              'cancelled'

          });

      }


      res.json({

        message:
          'Reservation cancelled'

      });

    }

    catch (error) {

      console.error(
        'Cancel reservation error:',
        error
      );


      if (
        error.message ===
        'RESERVATION_NOT_FOUND'
      ) {

        return res.status(404).json({
          message:
            'Reservation not found'
        });

      }


      if (
        error.message ===
        'RESERVATION_NOT_ACTIVE'
      ) {

        return res.status(409).json({
          message:
            'This reservation is not active'
        });

      }


      if (
        error.message ===
        'ITEM_NOT_FOUND'
      ) {

        return res.status(404).json({
          message:
            'Item associated with this reservation was not found'
        });

      }


      res.status(500).json({
        message:
          'Failed to cancel reservation'
      });

    }

  }
);


module.exports = router;