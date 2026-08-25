// Contributor: Shivani Jindal
// ============================================
// APP.JS - Main entry point, router, RBAC-aware navigation
// Temporary password / forced password change
// ============================================

import { Auth } from './auth.js';
import { Components } from './components.js';
import { Storage } from './storage.js';
import { Dashboard } from './dashboard.js';
import { Catalog } from './catalog.js';
import { Timeline } from './timeline.js';
import { WaitlistPage } from './waitlist.js';
import { FinesPage } from './fines.js';
import { AdminDashboard } from './adminDashboard.js';
import { AdminItems } from './adminItems.js';
import { AdminUsers } from './adminUsers.js';


// ============================================
// ROLE DEFINITIONS
// ============================================

const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
  LAB_MANAGER: 'lab_manager'
};


// ============================================
// MANAGEMENT ROLES
// ============================================

const ADMIN_ROLES = [
  ROLES.ADMIN,
  ROLES.LAB_MANAGER
];


// ============================================
// APPLICATION ROUTES
// ============================================

const ROUTES = {
  '/': Dashboard,
  '/catalog': Catalog,
  '/timeline': Timeline,
  '/waitlist': WaitlistPage,
  '/fines': FinesPage,
  '/admin': AdminDashboard,
  '/admin/items': AdminItems,

  // Admin user management
'/admin/users': AdminUsers
};


// ============================================
// ROLE-BASED ROUTE PERMISSIONS
// ============================================

const ROLE_ROUTES = {

  student: [
    '/',
    '/catalog',
    '/timeline',
    '/waitlist',
    '/fines'
  ],

  faculty: [
    '/',
    '/catalog',
    '/timeline',
    '/waitlist',
    '/fines'
  ],

  admin: [
  '/',
  '/catalog',
  '/timeline',
  '/waitlist',
  '/fines',
  '/admin',
  '/admin/items',
  '/admin/users'
],

  lab_manager: [
    '/',
    '/catalog',
    '/timeline',
    '/waitlist',
    '/fines',
    '/admin',
    '/admin/items'
  ]

};


// ============================================
// ADMIN-ONLY ROUTES
// ============================================

const ADMIN_ONLY_ROUTES = [
  '/admin',
  '/admin/items',
  '/admin/users'
];


// ============================================
// APP CLASS
// ============================================

class App {

  constructor() {

    this.currentRoute =
      window.location.pathname;

    this.user =
      Auth.getCurrentUser();

    this.init();

  }


  // ==========================================
  // INITIALIZE APPLICATION
  // ==========================================

  init() {

    // ----------------------------------------
    // Restore dark mode
    // ----------------------------------------

    if (
      document.documentElement &&
      Storage.get('theme') === 'dark'
    ) {

      document.documentElement
        .classList
        .add('dark');

    }


    // ----------------------------------------
    // Check authentication
    // ----------------------------------------

    if (!Auth.isLoggedIn()) {

      this.renderAuth();

      return;

    }


    // ----------------------------------------
    // Check forced password change
    // ----------------------------------------

    if (
      this.user?.mustChangePassword === true
    ) {

      this.renderChangePassword();

      return;

    }


    // ----------------------------------------
    // Logged-in application
    // ----------------------------------------

    this.renderLayout();

    this.setupGlobalListeners();


    // ----------------------------------------
    // Make sure route is valid
    // ----------------------------------------

    const initialRoute =
      Object.prototype.hasOwnProperty.call(
        ROUTES,
        this.currentRoute
      )
        ? this.currentRoute
        : '/';


    this.navigate(
      initialRoute,
      false
    );

  }


  // ==========================================
  // AUTH PAGE
  // ==========================================

  renderAuth() {

    const app =
      document.getElementById('app');

    app.innerHTML = '';


    const form =
      Components.authForm();

    app.appendChild(form);


    let mode = 'login';


    const title =
      form.querySelector('#auth-title');

    const subtitle =
      form.querySelector('#auth-subtitle');

    const registerFields =
      form.querySelector('#register-fields');

    const submitBtn =
      form.querySelector('#auth-submit');

    const toggleText =
      form.querySelector('#auth-toggle-text');

    const toggleLink =
      form.querySelector('#auth-toggle-link');

    const googleBtn =
      form.querySelector('#google-login-btn');


    // ========================================
    // LOGIN / REGISTER TOGGLE
    // ========================================

    toggleLink?.addEventListener(
      'click',
      (e) => {

        e.preventDefault();


        mode =
          mode === 'login'
            ? 'register'
            : 'login';


        const isRegister =
          mode === 'register';


        title.textContent =
          isRegister
            ? 'Create Account'
            : 'Welcome Back';


        subtitle.textContent =
          isRegister
            ? 'Join ResourceHub'
            : 'Sign in to your account';


        registerFields.classList.toggle(
          'hidden',
          !isRegister
        );


        submitBtn.textContent =
          isRegister
            ? 'Create Account'
            : 'Sign In';


        toggleText.textContent =
          isRegister
            ? 'Already have an account?'
            : "Don't have an account?";


        toggleLink.textContent =
          isRegister
            ? 'Sign In'
            : 'Register';

      }
    );


    // ========================================
    // EMAIL / PASSWORD LOGIN
    // ========================================

    form
      .querySelector('#login-form')
      ?.addEventListener(
        'submit',
        async (e) => {

          e.preventDefault();


          const email =
            form
              .querySelector('#email')
              .value
              .trim();


          const password =
            form
              .querySelector('#password')
              .value;


          try {

            // --------------------------------
            // NORMAL LOGIN
            // --------------------------------

            if (mode === 'login') {

              const loginResult =
                await Auth.login(
                  email,
                  password
                );


              this.user =
                loginResult.user ||
                loginResult;


              // --------------------------------
              // TEMPORARY PASSWORD
              // --------------------------------

              const mustChange =
                loginResult.mustChangePassword === true;


              if (mustChange) {

                this.renderChangePassword();

                return;

              }

            }


            // --------------------------------
            // REGISTER
            // --------------------------------
            //
            // IMPORTANT:
            // Public registration is disabled
            // by the new backend.
            //
            // This branch is kept only so an
            // old Components.authForm() does
            // not break the application.
            // --------------------------------

            else {

              throw new Error(
                'Registration is disabled. Please contact your administrator to create an account.'
              );

            }


            // --------------------------------
            // Go to dashboard
            // --------------------------------

            window.location.href = '/';


          } catch (err) {

            Components.showToast(
              err.message ||
              'Authentication failed',
              'error'
            );

          }

        }
      );


    // ========================================
    // GOOGLE LOGIN
    // ========================================

    googleBtn?.addEventListener(
      'click',
      async () => {

        // ------------------------------------
        // Prevent multiple clicks
        // ------------------------------------

        googleBtn.disabled = true;


        // ------------------------------------
        // Save original button
        // ------------------------------------

        const originalContent =
          googleBtn.innerHTML;


        // ------------------------------------
        // Loading state
        // ------------------------------------

        googleBtn.innerHTML = `
          <svg
            class="animate-spin"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-dasharray="40 20"
            />
          </svg>

          <span>Signing in...</span>
        `;


        try {

          // --------------------------------
          // Firebase Google authentication
          // --------------------------------

          const loginResult =
            await Auth.loginWithGoogle();


          // --------------------------------
          // Store application user
          // --------------------------------

          this.user =
            loginResult.user ||
            loginResult;


          // --------------------------------
          // Check temporary password flag
          // --------------------------------

          const mustChange =
            loginResult.mustChangePassword === true;


          if (mustChange) {

            this.renderChangePassword();

            return;

          }


          // --------------------------------
          // Success message
          // --------------------------------

          Components.showToast(
            `Welcome, ${this.user.name || 'User'}!`,
            'success'
          );


          // --------------------------------
          // Go to dashboard
          // --------------------------------

          window.location.href = '/';


        } catch (err) {

          console.error(
            'Google login error:',
            err
          );


          // --------------------------------
          // Restore button
          // --------------------------------

          googleBtn.disabled = false;

          googleBtn.innerHTML =
            originalContent;


          // --------------------------------
          // Firebase error handling
          // --------------------------------

          let message =
            err?.message ||
            'Google sign-in failed.';


          if (
            err?.code ===
            'auth/popup-closed-by-user'
          ) {

            message =
              'Google sign-in was cancelled.';

          }

          else if (
            err?.code ===
            'auth/popup-blocked'
          ) {

            message =
              'Google popup was blocked. Please allow popups for this site.';

          }

          else if (
            err?.code ===
            'auth/cancelled-popup-request'
          ) {

            message =
              'Google sign-in was cancelled.';

          }


          Components.showToast(
            message,
            'error'
          );

        }

      }
    );

  }


  // ==========================================
  // FORCE PASSWORD CHANGE SCREEN
  // ==========================================

  renderChangePassword() {

    const app =
      document.getElementById('app');

    if (!app) {
      return;
    }


    // ----------------------------------------
    // Prevent normal application layout
    // ----------------------------------------

    app.innerHTML = `

      <div class="min-h-screen w-full flex items-center justify-center
                  bg-slate-50 dark:bg-slate-900 px-4">

        <div class="w-full max-w-md">

          <div class="
            bg-white
            dark:bg-slate-800
            rounded-2xl
            shadow-xl
            border
            border-slate-200
            dark:border-slate-700
            p-8
          ">

            <div class="text-center mb-8">

              <div class="
                mx-auto
                w-14
                h-14
                rounded-full
                bg-primary-50
                dark:bg-primary-500/10
                flex
                items-center
                justify-center
                mb-4
              ">

                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-primary-600"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="10"
                    rx="2"
                  ></rect>

                  <path
                    d="M7 11V7a5 5 0 0 1 10 0v4"
                  ></path>
                </svg>

              </div>


              <h1 class="
                text-2xl
                font-bold
                text-slate-900
                dark:text-white
              ">
                Set Your Password
              </h1>


              <p class="
                mt-2
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
                Your administrator gave you a temporary password.
                Please create a new password before continuing.
              </p>

            </div>


            <div class="
              mb-6
              p-4
              rounded-xl
              bg-amber-50
              dark:bg-amber-500/10
              border
              border-amber-200
              dark:border-amber-500/20
            ">

              <p class="
                text-sm
                text-amber-800
                dark:text-amber-300
              ">
                For security, you must change your temporary
                password before accessing ResourceHub.
              </p>

            </div>


            <form id="change-password-form" class="space-y-5">

              <div>

                <label
                  for="current-password"
                  class="
                    block
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-300
                    mb-2
                  "
                >
                  Temporary Password
                </label>

                <input
                  id="current-password"
                  type="password"
                  autocomplete="current-password"
                  required
                  class="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-slate-300
                    dark:border-slate-600
                    bg-white
                    dark:bg-slate-900
                    text-slate-900
                    dark:text-white
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary-500
                  "
                  placeholder="Enter temporary password"
                />

              </div>


              <div>

                <label
                  for="new-password"
                  class="
                    block
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-300
                    mb-2
                  "
                >
                  New Password
                </label>

                <input
                  id="new-password"
                  type="password"
                  autocomplete="new-password"
                  minlength="8"
                  required
                  class="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-slate-300
                    dark:border-slate-600
                    bg-white
                    dark:bg-slate-900
                    text-slate-900
                    dark:text-white
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary-500
                  "
                  placeholder="Minimum 8 characters"
                />

              </div>


              <div>

                <label
                  for="confirm-password"
                  class="
                    block
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-300
                    mb-2
                  "
                >
                  Confirm New Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autocomplete="new-password"
                  minlength="8"
                  required
                  class="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-slate-300
                    dark:border-slate-600
                    bg-white
                    dark:bg-slate-900
                    text-slate-900
                    dark:text-white
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary-500
                  "
                  placeholder="Re-enter your new password"
                />

              </div>


              <p
                id="password-error"
                class="
                  hidden
                  text-sm
                  text-red-600
                  dark:text-red-400
                "
              ></p>


              <button
                id="change-password-submit"
                type="submit"
                class="
                  w-full
                  py-3
                  px-4
                  rounded-xl
                  bg-primary-600
                  hover:bg-primary-700
                  text-white
                  font-semibold
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                Set New Password
              </button>

            </form>


            <button
              id="change-password-logout"
              type="button"
              class="
                w-full
                mt-4
                py-2
                text-sm
                text-slate-500
                hover:text-slate-700
                dark:text-slate-400
                dark:hover:text-slate-200
              "
            >
              Logout
            </button>

          </div>

        </div>

      </div>

    `;


    // ========================================
    // FORM
    // ========================================

    const form =
      document.getElementById(
        'change-password-form'
      );

    const submitBtn =
      document.getElementById(
        'change-password-submit'
      );

    const errorElement =
      document.getElementById(
        'password-error'
      );


    form?.addEventListener(
      'submit',
      async (e) => {

        e.preventDefault();


        const currentPassword =
          document.getElementById(
            'current-password'
          ).value;


        const newPassword =
          document.getElementById(
            'new-password'
          ).value;


        const confirmPassword =
          document.getElementById(
            'confirm-password'
          ).value;


        // ------------------------------------
        // Clear previous error
        // ------------------------------------

        errorElement.classList.add(
          'hidden'
        );

        errorElement.textContent = '';


        // ------------------------------------
        // Validate passwords
        // ------------------------------------

        if (newPassword.length < 8) {

          errorElement.textContent =
            'New password must be at least 8 characters long.';

          errorElement.classList.remove(
            'hidden'
          );

          return;

        }


        if (
          newPassword !==
          confirmPassword
        ) {

          errorElement.textContent =
            'New passwords do not match.';

          errorElement.classList.remove(
            'hidden'
          );

          return;

        }


        if (
          currentPassword ===
          newPassword
        ) {

          errorElement.textContent =
            'New password must be different from the temporary password.';

          errorElement.classList.remove(
            'hidden'
          );

          return;

        }


        // ------------------------------------
        // Loading
        // ------------------------------------

        submitBtn.disabled = true;

        submitBtn.textContent =
          'Updating Password...';


        try {

          const result =
            await Auth.changePassword(
              currentPassword,
              newPassword
            );


          // --------------------------------
          // Update local session
          // --------------------------------

          this.user =
            result.user ||
            this.user;


          // --------------------------------
          // Make sure temporary flag is gone
          // --------------------------------

          if (this.user) {

            this.user.mustChangePassword =
              false;

            Storage.set(
              'user',
              this.user
            );

          }


          Components.showToast(
            'Password changed successfully!',
            'success'
          );


          // --------------------------------
          // Go to dashboard
          // --------------------------------

          setTimeout(
            () => {
              window.location.href = '/';
            },
            500
          );


        } catch (err) {

          console.error(
            'Password change error:',
            err
          );


          errorElement.textContent =
            err?.message ||
            'Could not change password. Please try again.';

          errorElement.classList.remove(
            'hidden'
          );


          submitBtn.disabled = false;

          submitBtn.textContent =
            'Set New Password';

        }

      }
    );


    // ========================================
    // LOGOUT FROM PASSWORD SCREEN
    // ========================================

    document
      .getElementById(
        'change-password-logout'
      )
      ?.addEventListener(
        'click',
        async () => {

          await Auth.logout();

          this.user = null;

          window.location.href = '/';

        }
      );

  }


  // ==========================================
  // GET CURRENT USER ROLE
  // ==========================================

  getUserRole() {

    return (
      this.user?.role ||
      ROLES.STUDENT
    );

  }


  // ==========================================
  // CHECK IF ROLE CAN ACCESS ROUTE
  // ==========================================

  canAccessRoute(path) {

    const role =
      this.getUserRole();


    const allowedRoutes =
      ROLE_ROUTES[role];


    if (!allowedRoutes) {

      return false;

    }


    return allowedRoutes.includes(path);

  }


  // ==========================================
  // CHECK MANAGEMENT ROLE
  // ==========================================

  isManagementRole() {

    return ADMIN_ROLES.includes(
      this.getUserRole()
    );

  }


  // ==========================================
  // MAIN APPLICATION LAYOUT
  // ==========================================

  renderLayout() {

    const isAdmin =
      this.isManagementRole();


    document.getElementById('app').innerHTML = `

      ${Components.sidebar(
        this.user,
        isAdmin
      )}

      <main
        id="main-content"
        class="flex-1 ml-64 p-8 overflow-y-auto min-h-screen"
      ></main>

    `;

  }


  // ==========================================
  // GLOBAL EVENT LISTENERS
  // ==========================================

  setupGlobalListeners() {

    // ----------------------------------------
    // Dark mode
    // ----------------------------------------

    document
      .getElementById('dark-mode-toggle')
      ?.addEventListener(
        'click',
        () => {

          document.documentElement
            .classList
            .toggle('dark');


          Storage.set(
            'theme',
            document.documentElement
              .classList
              .contains('dark')
              ? 'dark'
              : 'light'
          );

        }
      );


    // ----------------------------------------
    // Logout
    // ----------------------------------------

    document
      .getElementById('logout-btn')
      ?.addEventListener(
        'click',
        async () => {

          try {

            await Auth.logout();

          } catch (error) {

            console.warn(
              'Logout warning:',
              error
            );

          }


          this.user = null;


          window.location.href = '/';

        }
      );


    // ----------------------------------------
    // SPA navigation
    // ----------------------------------------

    document.body.addEventListener(
      'click',
      (e) => {

        const link =
          e.target.closest(
            '[data-route]'
          );


        if (!link) {
          return;
        }


        e.preventDefault();


        this.navigate(
          link.dataset.route
        );

      }
    );


    // ----------------------------------------
    // Browser back / forward
    // ----------------------------------------

    window.addEventListener(
      'popstate',
      () => {

        this.navigate(
          window.location.pathname,
          false
        );

      }
    );


    // ----------------------------------------
    // Keyboard shortcuts
    // ----------------------------------------

    document.addEventListener(
      'keydown',
      (e) => {

        // Ctrl + K

        if (
          (e.ctrlKey || e.metaKey) &&
          e.key === 'k'
        ) {

          e.preventDefault();


          if (
            this.canAccessRoute(
              '/catalog'
            )
          ) {

            this.navigate(
              '/catalog'
            );

          }

        }


        // Escape closes modal

        if (e.key === 'Escape') {

          window.closeModal?.();

        }

      }
    );

  }


  // ==========================================
  // ROUTER
  // ==========================================

  navigate(
    path,
    pushState = true
  ) {

    // ----------------------------------------
    // Make sure user exists
    // ----------------------------------------

    if (!this.user) {

      window.location.href = '/';

      return;

    }


    // ----------------------------------------
    // FORCE PASSWORD CHANGE
    // ----------------------------------------

    if (
      this.user.mustChangePassword === true
    ) {

      this.renderChangePassword();

      return;

    }


    const role =
      this.getUserRole();


    // ----------------------------------------
    // Check route permissions
    // ----------------------------------------

    if (
      !this.canAccessRoute(path)
    ) {

      Components.showToast(
        `Access denied for ${role.replace('_', ' ')} role`,
        'error'
      );


      path = '/';

    }


    // ----------------------------------------
    // Extra admin route protection
    // ----------------------------------------

    if (
      ADMIN_ONLY_ROUTES.includes(path) &&
      !this.isManagementRole()
    ) {

      Components.showToast(
        'Access denied for your role',
        'error'
      );


      path = '/';

    }


    // ----------------------------------------
    // Get page
    // ----------------------------------------

    const page =
      ROUTES[path] ||
      ROUTES['/'];


    // ----------------------------------------
    // Update browser URL
    // ----------------------------------------

    if (pushState) {

      history.pushState(
        {},
        '',
        path
      );

    }


    this.currentRoute =
      path;


    // ----------------------------------------
    // Refresh sidebar
    // ----------------------------------------

    this.renderLayout();

    this.setupGlobalListeners();


    // ----------------------------------------
    // Main content
    // ----------------------------------------

    const main =
      document.getElementById(
        'main-content'
      );


    // ----------------------------------------
    // Loading skeleton
    // ----------------------------------------

    main.innerHTML = `

      <div class="animate-pulse space-y-4">

        <div
          class="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"
        ></div>

        <div
          class="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"
        ></div>

      </div>

    `;


    // ----------------------------------------
    // Render selected page
    // ----------------------------------------

    Promise
      .resolve(
        page.render(
          main,
          this.user
        )
      )
      .catch(err => {

        console.error(
          'Page rendering error:',
          err
        );


        Components.showToast(
          err.message ||
          'Something went wrong',
          'error'
        );

      });

  }

}


// ============================================
// START APPLICATION
// ============================================

window.app =
  new App();