// ============================================
// AUTH ROUTES
// ============================================
// ResourceHub authentication system
//
// Features:
// - Admin-created accounts
// - Role assignment
// - Temporary password generation
// - Temporary password login
// - Mandatory password change
// - Automatic account-creation email
// - Normal email/password login
// - Google login for registered users only
// - Current user
// - Admin user list
//
// IMPORTANT:
// Firestore/db.js is asynchronous.
// Every db operation MUST use await.
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const {
  firebaseAuth,
  firestore
} = require('../firebase');

const db = require('../db');

const {
  requireAuth,
  JWT_SECRET
} = require('../middleware/auth');

const {
  allowRoles
} = require('../middleware/rbac');

const {
  sendAccountCreationEmail
} = require('../utils/email');

const router = express.Router();


// ============================================
// FIRESTORE COLLECTION
// ============================================

const usersCollection =
  firestore.collection('users');


// ============================================
// ALLOWED ROLES
// ============================================

const ALLOWED_ROLES = [
  'student',
  'faculty',
  'lab_manager',
  'admin'
];


const ADMIN_ROLES = [
  'admin'
];


// ============================================
// CREATE APPLICATION JWT
// ============================================

function signToken(user) {

  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );

}


// ============================================
// REMOVE PASSWORD FROM RESPONSE
// ============================================

function publicUser(user) {

  if (!user) {
    return null;
  }


  const {
    password,
    ...rest
  } = user;


  return rest;

}


// ============================================
// NORMALIZE EMAIL
// ============================================

function normalizeEmail(email) {

  return String(email || '')
    .trim()
    .toLowerCase();

}


// ============================================
// FIND USER BY EMAIL
// ============================================

async function findUserByEmail(email) {

  const normalizedEmail =
    normalizeEmail(email);


  if (!normalizedEmail) {
    return null;
  }


  const snapshot =
    await usersCollection
      .where(
        'email',
        '==',
        normalizedEmail
      )
      .limit(1)
      .get();


  if (snapshot.empty) {
    return null;
  }


  const doc =
    snapshot.docs[0];


  return {
    id: doc.id,
    ...doc.data()
  };

}


// ============================================
// FIND USER BY FIREBASE UID
// ============================================

async function findUserByFirebaseUid(
  firebaseUid
) {

  if (!firebaseUid) {
    return null;
  }


  const snapshot =
    await usersCollection
      .where(
        'firebaseUid',
        '==',
        firebaseUid
      )
      .limit(1)
      .get();


  if (snapshot.empty) {
    return null;
  }


  const doc =
    snapshot.docs[0];


  return {
    id: doc.id,
    ...doc.data()
  };

}


// ============================================
// SAVE USER TO FIRESTORE
// ============================================

async function saveUser(user) {

  await usersCollection
    .doc(user.id)
    .set(user);


  return user;

}


// ============================================
// GENERATE TEMPORARY PASSWORD
// ============================================

function generateTemporaryPassword() {

  return crypto
    .randomBytes(9)
    .toString('base64url');

}


// ============================================
// VALIDATE EMAIL
// ============================================

function isValidEmail(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


// ============================================
// ADMIN CREATE USER
// ============================================
//
// POST /api/auth/admin/create-user
//
// Only administrators can create accounts.
//
// Body:
//
// {
//   "name": "John Doe",
//   "email": "john@gmail.com",
//   "role": "student"
// }
//
// Response:
//
// {
//   "message": "...",
//   "user": {...},
//   "temporaryPassword": "..."
// }
//
// ============================================

router.post(
  '/admin/create-user',
  requireAuth,
  allowRoles('admin'),
  async (req, res) => {

    try {

      const {
        name,
        email,
        role
      } = req.body;


      // ----------------------------------------
      // Validate name
      // ----------------------------------------

      const cleanName =
        String(name || '').trim();


      if (!cleanName) {

        return res.status(400).json({
          message: 'Name is required'
        });

      }


      // ----------------------------------------
      // Validate email
      // ----------------------------------------

      const normalizedEmail =
        normalizeEmail(email);


      if (!normalizedEmail) {

        return res.status(400).json({
          message: 'Email is required'
        });

      }


      if (
        !isValidEmail(
          normalizedEmail
        )
      ) {

        return res.status(400).json({
          message:
            'Please enter a valid email address'
        });

      }


      // ----------------------------------------
      // Validate role
      // ----------------------------------------

      if (
        !role ||
        !ALLOWED_ROLES.includes(role)
      ) {

        return res.status(400).json({
          message:
            'Invalid role. Allowed roles: student, faculty, lab_manager, admin'
        });

      }


      // ----------------------------------------
      // Check Firestore
      // ----------------------------------------

      let existingUser =
        await findUserByEmail(
          normalizedEmail
        );


      // ----------------------------------------
      // Check legacy database
      // ----------------------------------------

      if (!existingUser) {

        existingUser =
          await db.findOne(
            'users',
            user =>
              user.email &&
              String(user.email)
                .trim()
                .toLowerCase() ===
              normalizedEmail
          );

      }


      // ----------------------------------------
      // Duplicate account
      // ----------------------------------------

      if (existingUser) {

        return res.status(409).json({
          message:
            'An account with this email already exists'
        });

      }


      // ----------------------------------------
      // Generate temporary password
      // ----------------------------------------

      const temporaryPassword =
        generateTemporaryPassword();


      // ----------------------------------------
      // Create user object
      // ----------------------------------------

      const user = {

        id:
          crypto.randomUUID(),

        name:
          cleanName,

        email:
          normalizedEmail,

        password:
          bcrypt.hashSync(
            temporaryPassword,
            10
          ),

        role,

        reliabilityScore:
          75,

        authProvider:
          'password',

        mustChangePassword:
          true,

        createdBy:
          req.user.id,

        createdAt:
          new Date().toISOString()

      };


      // ----------------------------------------
      // Save to Firestore
      // ----------------------------------------

      await saveUser(user);


      console.log(
        `✓ Admin ${req.user.email} created user ${normalizedEmail} with role ${role}`
      );


      // ----------------------------------------
      // SEND ACCOUNT CREATION EMAIL
      // ----------------------------------------
      //
      // The plain temporary password is only
      // available here.
      //
      // Firestore contains only the bcrypt hash.
      //
      // ----------------------------------------

      const loginUrl =
        process.env.APP_LOGIN_URL ||
        `http://localhost:${process.env.PORT || 5000}`;


      try {

        await sendAccountCreationEmail({

          name:
            cleanName,

          email:
            normalizedEmail,

          role,

          temporaryPassword,

          loginUrl

        });


        console.log(
          `✓ Account email sent to ${normalizedEmail}`
        );

      }
      catch (emailError) {

        // --------------------------------------
        // IMPORTANT:
        //
        // The user has already been successfully
        // created in Firestore.
        //
        // We don't delete the account just
        // because email delivery failed.
        // --------------------------------------

        console.error(
          `✕ Could not send account email to ${normalizedEmail}:`,
          emailError.message
        );


        return res.status(201).json({

          message:
            'User account created, but the email could not be sent.',

          emailSent:
            false,

          emailError:
            emailError.message,

          user:
            publicUser(user),

          temporaryPassword

        });

      }


      // ----------------------------------------
      // Return success
      // ----------------------------------------

      return res.status(201).json({

        message:
          'User account created successfully and login details were emailed.',

        emailSent:
          true,

        user:
          publicUser(user),

        temporaryPassword

      });

    }
    catch (error) {

      console.error(
        'Admin user creation error:',
        error
      );


      return res.status(500).json({

        message:
          error.message ||
          'Could not create user account'

      });

    }

  }
);


// ============================================
// NORMAL EMAIL / PASSWORD LOGIN
// ============================================
//
// Temporary passwords also work here.
//
// If mustChangePassword === true,
// frontend must show password-change screen.
//
// ============================================

router.post(
  '/login',
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;


      const normalizedEmail =
        normalizeEmail(email);


      // ----------------------------------------
      // Validate
      // ----------------------------------------

      if (
        !normalizedEmail ||
        !password
      ) {

        return res.status(400).json({
          message:
            'Email and password are required'
        });

      }


      // ----------------------------------------
      // Find Firestore user
      // ----------------------------------------

      let user =
        await findUserByEmail(
          normalizedEmail
        );


      // ----------------------------------------
      // Legacy fallback
      // ----------------------------------------

      if (!user) {

        const legacyUser =
          await db.findOne(
            'users',
            u =>
              u.email &&
              String(u.email)
                .trim()
                .toLowerCase() ===
              normalizedEmail
          );


        if (legacyUser) {

          user =
            legacyUser;


          // Move legacy account
          // into Firestore

          await saveUser(
            user
          );

        }

      }


      // ----------------------------------------
      // User does not exist
      // ----------------------------------------

      if (!user) {

        return res.status(401).json({
          message:
            'Invalid email or password'
        });

      }


      // ----------------------------------------
      // Validate password
      // ----------------------------------------

      if (
        !user.password ||
        !bcrypt.compareSync(
          password,
          user.password
        )
      ) {

        return res.status(401).json({
          message:
            'Invalid email or password'
        });

      }


      // ----------------------------------------
      // Create JWT
      // ----------------------------------------

      const token =
        signToken(user);


      // ----------------------------------------
      // Login response
      // ----------------------------------------

      return res.json({

        token,

        user:
          publicUser(user),

        mustChangePassword:
          user.mustChangePassword === true

      });

    }
    catch (error) {

      console.error(
        'Login error:',
        error
      );


      return res.status(500).json({
        message:
          error.message ||
          'Login failed'
      });

    }

  }
);


// ============================================
// CHANGE PASSWORD
// ============================================
//
// POST /api/auth/change-password
//
// Requires application JWT.
//
// Body:
//
// {
//   "currentPassword": "...",
//   "newPassword": "..."
// }
//
// ============================================

router.post(
  '/change-password',
  requireAuth,
  async (req, res) => {

    try {

      const {
        currentPassword,
        newPassword
      } = req.body;


      // ----------------------------------------
      // Validate input
      // ----------------------------------------

      if (
        !currentPassword ||
        !newPassword
      ) {

        return res.status(400).json({
          message:
            'Current password and new password are required'
        });

      }


      // ----------------------------------------
      // Password strength
      // ----------------------------------------

      if (
        String(newPassword).length < 8
      ) {

        return res.status(400).json({
          message:
            'New password must be at least 8 characters long'
        });

      }


      if (
        currentPassword ===
        newPassword
      ) {

        return res.status(400).json({
          message:
            'New password must be different from the current password'
        });

      }


      // ----------------------------------------
      // Find Firestore user
      // ----------------------------------------

      const snapshot =
        await usersCollection
          .doc(req.user.id)
          .get();


      // ----------------------------------------
      // User not found
      // ----------------------------------------

      if (!snapshot.exists) {

        return res.status(404).json({
          message:
            'User not found'
        });

      }


      const user = {

        id:
          snapshot.id,

        ...snapshot.data()

      };


      // ----------------------------------------
      // Verify current password
      // ----------------------------------------

      if (
        !user.password ||
        !bcrypt.compareSync(
          currentPassword,
          user.password
        )
      ) {

        return res.status(401).json({
          message:
            'Current password is incorrect'
        });

      }


      // ----------------------------------------
      // Hash new password
      // ----------------------------------------

      const newPasswordHash =
        bcrypt.hashSync(
          newPassword,
          10
        );


      // ----------------------------------------
      // Update user
      // ----------------------------------------

      const updatedUser = {

        ...user,

        password:
          newPasswordHash,

        mustChangePassword:
          false,

        passwordChangedAt:
          new Date().toISOString()

      };


      await saveUser(
        updatedUser
      );


      // ----------------------------------------
      // Create fresh JWT
      // ----------------------------------------

      const token =
        signToken(
          updatedUser
        );


      // ----------------------------------------
      // Response
      // ----------------------------------------

      return res.json({

        message:
          'Password changed successfully',

        token,

        user:
          publicUser(
            updatedUser
          ),

        mustChangePassword:
          false

      });

    }
    catch (error) {

      console.error(
        'Change password error:',
        error
      );


      return res.status(500).json({
        message:
          error.message ||
          'Could not change password'
      });

    }

  }
);


// ============================================
// GOOGLE LOGIN
// ============================================
//
// Google accounts MUST already exist.
//
// Google login NEVER creates a new account.
//
// Admin first creates:
//
// Gmail + role
//
// Then the user can login using Google.
//
// ============================================

router.post(
  '/google',
  async (req, res) => {

    try {

      const {
        firebaseToken
      } = req.body;


      // ----------------------------------------
      // Validate token
      // ----------------------------------------

      if (!firebaseToken) {

        return res.status(400).json({
          message:
            'Firebase authentication token is required'
        });

      }


      // ----------------------------------------
      // Verify Firebase token
      // ----------------------------------------

      const decodedToken =
        await firebaseAuth.verifyIdToken(
          firebaseToken
        );


      const firebaseUid =
        decodedToken.uid;


      const email =
        decodedToken.email;


      const name =
        decodedToken.name ||
        decodedToken.email?.split('@')[0] ||
        'Google User';


      const picture =
        decodedToken.picture ||
        null;


      // ----------------------------------------
      // Require verified email
      // ----------------------------------------

      if (
        !email ||
        decodedToken.email_verified !== true
      ) {

        return res.status(401).json({
          message:
            'Google account email could not be verified'
        });

      }


      const normalizedEmail =
        normalizeEmail(email);


      // ----------------------------------------
      // Find by Firebase UID
      // ----------------------------------------

      let user =
        await findUserByFirebaseUid(
          firebaseUid
        );


      // ----------------------------------------
      // Find by email
      // ----------------------------------------

      if (!user) {

        user =
          await findUserByEmail(
            normalizedEmail
          );

      }


      // ----------------------------------------
      // Google account not registered
      // ----------------------------------------

      if (!user) {

        return res.status(403).json({
          message:
            'This Google account has not been registered by an administrator. Please contact your administrator.'
        });

      }


      // ----------------------------------------
      // Link Firebase account
      // ----------------------------------------

      const updates = {};


      if (!user.firebaseUid) {

        updates.firebaseUid =
          firebaseUid;

      }


      updates.photoURL =
        picture;


      updates.authProvider =
        'google';


      if (
        Object.keys(updates).length > 0
      ) {

        user = {

          ...user,

          ...updates

        };


        await saveUser(
          user
        );

      }


      // ----------------------------------------
      // IMPORTANT
      //
      // Never change the role here.
      // ----------------------------------------

      const token =
        signToken(
          user
        );


      return res.json({

        token,

        user:
          publicUser(user),

        mustChangePassword:
          user.mustChangePassword === true

      });

    }
    catch (error) {

      console.error(
        'Google authentication error:',
        error
      );


      if (
        error.code ===
          'auth/id-token-expired' ||

        error.code ===
          'auth/id-token-revoked' ||

        error.code ===
          'auth/argument-error' ||

        error.code ===
          'auth/invalid-id-token'
      ) {

        return res.status(401).json({
          message:
            'Invalid or expired Google authentication token'
        });

      }


      return res.status(500).json({
        message:
          error.message ||
          'Google authentication failed'
      });

    }

  }
);


// ============================================
// CURRENT USER
// ============================================
//
// GET /api/auth/me
//
// ============================================

router.get(
  '/me',
  requireAuth,
  async (req, res) => {

    try {

      // ----------------------------------------
      // Firestore
      // ----------------------------------------

      const snapshot =
        await usersCollection
          .doc(req.user.id)
          .get();


      if (snapshot.exists) {

        return res.json(
          publicUser({

            id:
              snapshot.id,

            ...snapshot.data()

          })
        );

      }


      // ----------------------------------------
      // Legacy fallback
      // ----------------------------------------

      const legacyUser =
        await db.findById(
          'users',
          req.user.id
        );


      if (!legacyUser) {

        return res.status(404).json({
          message:
            'User not found'
        });

      }


      // ----------------------------------------
      // Move legacy account to Firestore
      // ----------------------------------------

      await saveUser(
        legacyUser
      );


      return res.json(
        publicUser(
          legacyUser
        )
      );

    }
    catch (error) {

      console.error(
        'Current user error:',
        error
      );


      return res.status(500).json({
        message:
          error.message ||
          'Could not retrieve current user'
      });

    }

  }
);


// ============================================
// GET ALL USERS
// ============================================
//
// GET /api/auth/users
//
// ADMIN ONLY
//
// ============================================

router.get(
  '/users',
  requireAuth,
  allowRoles('admin'),
  async (req, res) => {

    try {

      const snapshot =
        await usersCollection.get();


      const users =
        snapshot.docs.map(
          doc => {

            const user = {

              id:
                doc.id,

              ...doc.data()

            };


            return publicUser(
              user
            );

          }
        );


      // ----------------------------------------
      // Sort alphabetically
      // ----------------------------------------

      users.sort(
        (a, b) => {

          const nameA =
            String(a.name || '')
              .toLowerCase();


          const nameB =
            String(b.name || '')
              .toLowerCase();


          return nameA.localeCompare(
            nameB
          );

        }
      );


      return res.json(
        users
      );

    }
    catch (error) {

      console.error(
        'Get users error:',
        error
      );


      return res.status(500).json({
        message:
          error.message ||
          'Could not retrieve users'
      });

    }

  }
);

// ============================================
// DELETE USER
// ============================================
//
// DELETE /api/auth/users/:id
//
// ADMIN ONLY
//
// Prevents an administrator from deleting
// their own account.
//
// ============================================

router.delete(
  '/users/:id',
  requireAuth,
  allowRoles('admin'),
  async (req, res) => {

    try {

      const userId = req.params.id;


      // ----------------------------------------
      // Validate ID
      // ----------------------------------------

      if (!userId) {

        return res.status(400).json({
          message: 'User ID is required'
        });

      }


      // ----------------------------------------
      // Prevent admin from deleting themselves
      // ----------------------------------------

      if (userId === req.user.id) {

        return res.status(400).json({
          message:
            'You cannot delete your own account'
        });

      }


      // ----------------------------------------
      // Check if user exists
      // ----------------------------------------

      const userRef =
        usersCollection.doc(userId);

      const userSnapshot =
        await userRef.get();


      if (!userSnapshot.exists) {

        return res.status(404).json({
          message:
            'User not found'
        });

      }


      const user = {

        id:
          userSnapshot.id,

        ...userSnapshot.data()

      };


      // ----------------------------------------
      // Delete from Firestore
      // ----------------------------------------

      await userRef.delete();


      console.log(
        `✓ Admin ${req.user.email} deleted user ${user.email}`
      );


      // ----------------------------------------
      // Success response
      // ----------------------------------------

      return res.json({

        message:
          'User deleted successfully',

        deletedUser: {

          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role

        }

      });

    }
    catch (error) {

      console.error(
        'Delete user error:',
        error
      );


      return res.status(500).json({

        message:
          error.message ||
          'Could not delete user'

      });

    }

  }
);

// ============================================
// EXPORT
// ============================================

module.exports = router;