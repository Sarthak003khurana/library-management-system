// Contributor: Shivani Jindal
// ============================================
// AUTH.JS - Authentication / session helpers
// Includes:
// - Email/password login
// - Google Firebase login
// - Forced temporary-password change
// - Logout
// ============================================

import { API } from './api.js';
import { Storage } from './storage.js';


// ============================================
// FIREBASE GOOGLE AUTHENTICATION
// ============================================

async function loginWithGoogleFirebase() {

  // Firebase is initialized in index.html
  if (!window.firebaseAuth) {

    throw new Error(
      'Firebase Authentication is not initialized. Please check index.html.'
    );

  }


  // Import Firebase authentication functions
  const {
    GoogleAuthProvider,
    signInWithPopup
  } = await import(
    'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js'
  );


  // Create Google provider
  const provider =
    new GoogleAuthProvider();


  // Ask Google for basic profile information
  provider.addScope('profile');
  provider.addScope('email');


  // Open Google login popup
  const result =
    await signInWithPopup(
      window.firebaseAuth,
      provider
    );


  // Firebase user
  const firebaseUser =
    result.user;


  if (!firebaseUser) {

    throw new Error(
      'Google authentication failed.'
    );

  }


  // Get Firebase ID token
  const firebaseToken =
    await firebaseUser.getIdToken();


  return {
    firebaseUser,
    firebaseToken
  };

}


// ============================================
// AUTH OBJECT
// ============================================

export const Auth = {


  // ==========================================
  // GET CURRENT USER
  // ==========================================

  getCurrentUser() {

    return Storage.get(
      'user',
      null
    );

  },


  // ==========================================
  // CHECK LOGIN STATUS
  // ==========================================

  isLoggedIn() {

    return !!Storage.get(
      'token'
    );

  },


  // ==========================================
  // NORMAL EMAIL / PASSWORD LOGIN
  // ==========================================

  async login(
    email,
    password
  ) {

    const data =
      await API.post(
        '/api/auth/login',
        {
          email,
          password
        }
      );


    // ----------------------------------------
    // Store JWT
    // ----------------------------------------

    if (data.token) {

      Storage.set(
        'token',
        data.token
      );

    }


    // ----------------------------------------
    // Store user
    // ----------------------------------------

    if (data.user) {

      Storage.set(
        'user',
        data.user
      );

    }


    // ----------------------------------------
    // Return complete backend response
    // ----------------------------------------
    //
    // We return `data`, rather than only
    // data.user, because the backend may send:
    //
    // {
    //   token,
    //   user,
    //   mustChangePassword
    // }
    //
    // The app.js can then decide whether the
    // user must change their temporary password.
    // ----------------------------------------

    return data;

  },


  // ==========================================
  // REGISTER
  // ==========================================
  //
  // Registration is no longer part of the
  // intended user-management flow.
  //
  // New users should be created by an admin.
  //
  // Kept here temporarily so older frontend
  // code does not cause an import error.
  // ==========================================

  async register(
    name,
    email,
    password,
    role
  ) {

    const data =
      await API.post(
        '/api/auth/register',
        {
          name,
          email,
          password,
          role
        }
      );


    if (data.token) {

      Storage.set(
        'token',
        data.token
      );

    }


    if (data.user) {

      Storage.set(
        'user',
        data.user
      );

    }


    return data;

  },


  // ==========================================
  // CHANGE PASSWORD
  // ==========================================
  //
  // Used when an administrator creates a user
  // with a temporary password.
  //
  // Expected backend endpoint:
  //
  // POST /api/auth/change-password
  //
  // Body:
  //
  // {
  //   currentPassword,
  //   newPassword
  // }
  //
  // Expected response:
  //
  // {
  //   message,
  //   user,
  //   token
  // }
  // ==========================================

  async changePassword(
    currentPassword,
    newPassword
  ) {

    const data =
      await API.post(
        '/api/auth/change-password',
        {
          currentPassword,
          newPassword
        }
      );


    // ----------------------------------------
    // Backend may issue a fresh JWT after
    // changing the password.
    // ----------------------------------------

    if (data.token) {

      Storage.set(
        'token',
        data.token
      );

    }


    // ----------------------------------------
    // Update user in local storage
    // ----------------------------------------

    if (data.user) {

      Storage.set(
        'user',
        data.user
      );

    }
    else {

      // If backend doesn't return a user,
      // update the existing local user.
      const currentUser =
        Storage.get(
          'user',
          null
        );


      if (currentUser) {

        currentUser.mustChangePassword =
          false;


        Storage.set(
          'user',
          currentUser
        );

      }

    }


    return data;

  },


  // ==========================================
  // GOOGLE LOGIN
  // ==========================================

  async loginWithGoogle() {

    // ----------------------------------------
    // Step 1:
    // Authenticate using Firebase Google
    // ----------------------------------------

    const {
      firebaseUser,
      firebaseToken
    } =
      await loginWithGoogleFirebase();


    // ----------------------------------------
    // Step 2:
    // Send Firebase token to backend
    // ----------------------------------------

    const data =
      await API.post(
        '/api/auth/google',
        {
          firebaseToken
        }
      );


    // ----------------------------------------
    // Step 3:
    // Store application's JWT
    // ----------------------------------------

    if (data.token) {

      Storage.set(
        'token',
        data.token
      );

    }


    // ----------------------------------------
    // Step 4:
    // Store application user
    // ----------------------------------------

    if (data.user) {

      Storage.set(
        'user',
        data.user
      );

    }


    // ----------------------------------------
    // Return complete backend response
    // ----------------------------------------
    //
    // This is important because Google login
    // can also return mustChangePassword.
    // ----------------------------------------

    return data;

  },


  // ==========================================
  // LOGOUT
  // ==========================================

  async logout() {

    // ----------------------------------------
    // Sign out from Firebase
    // ----------------------------------------

    if (window.firebaseAuth) {

      try {

        const {
          signOut
        } = await import(
          'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js'
        );


        await signOut(
          window.firebaseAuth
        );

      }
      catch (error) {

        console.warn(
          'Firebase logout warning:',
          error
        );

      }

    }


    // ----------------------------------------
    // Remove application session
    // ----------------------------------------

    Storage.remove(
      'token'
    );

    Storage.remove(
      'user'
    );

  }

};