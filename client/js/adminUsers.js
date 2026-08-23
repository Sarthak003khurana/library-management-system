// ============================================
// ADMIN USERS.JS
// ============================================
// Admin-only user management.
//
// Features:
// - View all users
// - Create new users
// - Assign roles
// - Generate temporary password
// - Show temporary password once
// - Copy temporary password
// - Show password-change status
// - Show reliability score
// - Delete users
// ============================================

import { API } from './api.js';


// ============================================
// ADMIN USERS
// ============================================

export const AdminUsers = {

  // ==========================================
  // RENDER PAGE
  // ==========================================

  async render(container) {

    container.innerHTML = `

      <div class="space-y-8 fade-in">

        <!-- ================================== -->
        <!-- HEADER -->
        <!-- ================================== -->

        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <h1 class="text-3xl font-bold">
              Manage Users
            </h1>

            <p class="text-slate-500 dark:text-slate-400 mt-1">
              Create accounts and assign roles to users.
            </p>

          </div>


          <button
            id="open-create-user-btn"
            type="button"
            class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition"
          >
            + Create User
          </button>

        </div>


        <!-- ================================== -->
        <!-- TEMPORARY PASSWORD -->
        <!-- ================================== -->

        <div
          id="temporary-password-container"
          class="hidden"
        ></div>


        <!-- ================================== -->
        <!-- CREATE USER FORM -->
        <!-- ================================== -->

        <div
          id="create-user-form-container"
          class="hidden p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >

          <div class="flex items-center justify-between mb-5">

            <div>

              <h2 class="text-xl font-semibold">
                Create New User
              </h2>

              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                The user will receive a temporary password.
              </p>

            </div>


            <button
              id="close-create-user-btn"
              type="button"
              class="text-slate-500 hover:text-slate-800 dark:hover:text-white text-xl"
              title="Close"
            >
              ✕
            </button>

          </div>


          <!-- ================================= -->
          <!-- FORM -->
          <!-- ================================= -->

          <form id="create-user-form">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

              <!-- NAME -->

              <div>

                <label
                  for="new-user-name"
                  class="block text-sm font-medium mb-2"
                >
                  Full Name
                </label>

                <input
                  id="new-user-name"
                  type="text"
                  required
                  autocomplete="name"
                  placeholder="Enter full name"
                  class="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

              </div>


              <!-- EMAIL -->

              <div>

                <label
                  for="new-user-email"
                  class="block text-sm font-medium mb-2"
                >
                  Gmail / Email
                </label>

                <input
                  id="new-user-email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="example@gmail.com"
                  class="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

              </div>


              <!-- ROLE -->

              <div>

                <label
                  for="new-user-role"
                  class="block text-sm font-medium mb-2"
                >
                  Assign Role
                </label>

                <select
                  id="new-user-role"
                  required
                  class="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >

                  <option value="">
                    Select a role
                  </option>

                  <option value="student">
                    Student
                  </option>

                  <option value="faculty">
                    Faculty
                  </option>

                  <option value="lab_manager">
                    Lab Manager
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                </select>

              </div>

            </div>


            <!-- ================================= -->
            <!-- WARNING -->
            <!-- ================================= -->

            <div
              class="mt-5 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            >

              <div class="flex gap-3">

                <span class="text-xl">
                  ⚠️
                </span>

                <div>

                  <p class="font-medium text-amber-800 dark:text-amber-300">
                    Temporary password
                  </p>

                  <p class="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    A temporary password will be generated automatically.
                    The login details will be sent to the user's email.
                    They will be required to change it after their first login.
                  </p>

                </div>

              </div>

            </div>


            <!-- ================================= -->
            <!-- BUTTONS -->
            <!-- ================================= -->

            <div class="flex justify-end gap-3 mt-6">

              <button
                type="button"
                id="cancel-create-user-btn"
                class="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>


              <button
                type="submit"
                id="create-user-submit-btn"
                class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition"
              >
                Create Account
              </button>

            </div>

          </form>

        </div>


        <!-- ================================== -->
        <!-- REGISTERED USERS -->
        <!-- ================================== -->

        <div
          class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
        >

          <div class="flex items-center justify-between mb-4">

            <div>

              <h2 class="text-xl font-semibold">
                Registered Users
              </h2>

              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                View users, roles and password status.
              </p>

            </div>


            <button
              id="refresh-users-btn"
              type="button"
              class="text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              ↻ Refresh
            </button>

          </div>


          <div
            id="users-table-container"
            class="overflow-x-auto"
          >

            <div class="py-8 text-center text-slate-500">
              Loading users...
            </div>

          </div>

        </div>

      </div>

    `;


    // Setup buttons
    this.setupUserManagement();


    // Load users
    await this.loadUsers();

  },


  // ==========================================
  // SETUP USER MANAGEMENT
  // ==========================================

  setupUserManagement() {

    const openButton =
      document.getElementById(
        'open-create-user-btn'
      );

    const closeButton =
      document.getElementById(
        'close-create-user-btn'
      );

    const cancelButton =
      document.getElementById(
        'cancel-create-user-btn'
      );

    const form =
      document.getElementById(
        'create-user-form'
      );

    const refreshButton =
      document.getElementById(
        'refresh-users-btn'
      );


    // ----------------------------------------
    // OPEN CREATE FORM
    // ----------------------------------------

    if (openButton) {

      openButton.addEventListener(
        'click',
        () => {

          const formContainer =
            document.getElementById(
              'create-user-form-container'
            );

          if (formContainer) {

            formContainer.classList.remove(
              'hidden'
            );

          }

          openButton.classList.add(
            'hidden'
          );

        }
      );

    }


    // ----------------------------------------
    // CLOSE FORM
    // ----------------------------------------

    const closeForm = () => {

      const formContainer =
        document.getElementById(
          'create-user-form-container'
        );

      if (formContainer) {

        formContainer.classList.add(
          'hidden'
        );

      }

      if (openButton) {

        openButton.classList.remove(
          'hidden'
        );

      }

    };


    if (closeButton) {

      closeButton.addEventListener(
        'click',
        closeForm
      );

    }


    if (cancelButton) {

      cancelButton.addEventListener(
        'click',
        closeForm
      );

    }


    // ----------------------------------------
    // CREATE USER
    // ----------------------------------------

    if (form) {

      form.addEventListener(
        'submit',
        async (event) => {

          event.preventDefault();

          await this.createUser();

        }
      );

    }


    // ----------------------------------------
    // REFRESH USERS
    // ----------------------------------------

    if (refreshButton) {

      refreshButton.addEventListener(
        'click',
        async () => {

          refreshButton.disabled = true;

          refreshButton.textContent =
            'Loading...';

          try {

            await this.loadUsers();

          }
          finally {

            refreshButton.disabled =
              false;

            refreshButton.textContent =
              '↻ Refresh';

          }

        }
      );

    }

  },


  // ==========================================
  // CREATE USER
  // ==========================================

  async createUser() {

    const nameInput =
      document.getElementById(
        'new-user-name'
      );

    const emailInput =
      document.getElementById(
        'new-user-email'
      );

    const roleInput =
      document.getElementById(
        'new-user-role'
      );

    const submitButton =
      document.getElementById(
        'create-user-submit-btn'
      );


    if (
      !nameInput ||
      !emailInput ||
      !roleInput ||
      !submitButton
    ) {

      console.error(
        'Create user form elements are missing.'
      );

      return;

    }


    const name =
      nameInput.value.trim();

    const email =
      emailInput.value.trim().toLowerCase();

    const role =
      roleInput.value;


    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (!name) {

      alert(
        'Please enter the user name.'
      );

      return;

    }


    if (!email) {

      alert(
        'Please enter the user email.'
      );

      return;

    }


    if (!role) {

      alert(
        'Please select a role.'
      );

      return;

    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

      alert(
        'Please enter a valid email address.'
      );

      return;

    }


    // ----------------------------------------
    // DISABLE BUTTON
    // ----------------------------------------

    submitButton.disabled = true;

    submitButton.textContent =
      'Creating...';


    try {

      const data =
        await API.post(
          '/api/auth/admin/create-user',
          {
            name,
            email,
            role
          }
        );


      // Show temporary password
      this.showTemporaryPassword(
        data
      );


      // Reset form
      const form =
        document.getElementById(
          'create-user-form'
        );

      if (form) {

        form.reset();

      }


      // Close form
      const formContainer =
        document.getElementById(
          'create-user-form-container'
        );

      if (formContainer) {

        formContainer.classList.add(
          'hidden'
        );

      }


      const openButton =
        document.getElementById(
          'open-create-user-btn'
        );

      if (openButton) {

        openButton.classList.remove(
          'hidden'
        );

      }


      // Reload users
      await this.loadUsers();

    }
    catch (error) {

      console.error(
        'Create user error:',
        error
      );

      alert(
        error.message ||
        'Could not create user.'
      );

    }
    finally {

      submitButton.disabled =
        false;

      submitButton.textContent =
        'Create Account';

    }

  },


  // ==========================================
  // SHOW TEMPORARY PASSWORD
  // ==========================================

  showTemporaryPassword(data) {

    const container =
      document.getElementById(
        'temporary-password-container'
      );


    if (!container) {

      return;

    }


    const password =
      data?.temporaryPassword || '';

    const user =
      data?.user || {};


    container.classList.remove(
      'hidden'
    );


    const emailStatus =
      data?.emailSent === true
        ? `
          <p class="text-sm text-green-700 dark:text-green-400 mt-2">
            📧 Account details were emailed successfully to
            <strong>${this.escapeHtml(user.email || '')}</strong>.
          </p>
        `
        : `
          <p class="text-sm text-red-700 dark:text-red-400 mt-2">
            ⚠️ The account was created, but the email could not be sent.
            Please provide the temporary password to the user securely.
          </p>
        `;


    container.innerHTML = `

      <div
        class="p-5 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
      >

        <div class="flex gap-4">

          <div class="text-2xl">
            ✓
          </div>

          <div class="flex-1">

            <h3 class="font-semibold text-green-800 dark:text-green-300">
              Account created successfully
            </h3>


            <p class="text-sm text-green-700 dark:text-green-400 mt-1">

              ${this.escapeHtml(
                user.name || ''
              )}

              (${this.escapeHtml(
                user.email || ''
              )})

              has been assigned the

              <strong>
                ${this.formatRole(
                  user.role
                )}
              </strong>

              role.

            </p>


            ${emailStatus}


            <div class="mt-4">

              <p class="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400 mb-2">
                Temporary Password
              </p>


              <div class="flex flex-col sm:flex-row gap-2">

                <div
                  id="temporary-password-value"
                  class="flex-1 px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-green-300 dark:border-green-700 font-mono text-lg font-semibold break-all"
                >
                  ${this.escapeHtml(
                    password
                  )}
                </div>


                <button
                  id="copy-temporary-password-btn"
                  type="button"
                  class="px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition"
                >
                  Copy Password
                </button>

              </div>


              <p class="text-xs text-green-700 dark:text-green-400 mt-3">
                ⚠️ Save or copy this password now.
                It will not be shown again.
              </p>

            </div>

          </div>

        </div>

      </div>

    `;


    // ----------------------------------------
    // COPY PASSWORD
    // ----------------------------------------

    const copyButton =
      document.getElementById(
        'copy-temporary-password-btn'
      );


    if (copyButton) {

      copyButton.addEventListener(
        'click',
        async () => {

          try {

            await navigator.clipboard.writeText(
              password
            );

            copyButton.textContent =
              '✓ Copied';

            setTimeout(
              () => {

                copyButton.textContent =
                  'Copy Password';

              },
              2000
            );

          }
          catch (error) {

            console.error(
              'Clipboard error:',
              error
            );


            // Fallback

            const textArea =
              document.createElement(
                'textarea'
              );

            textArea.value =
              password;

            document.body.appendChild(
              textArea
            );

            textArea.select();


            try {

              document.execCommand(
                'copy'
              );

              copyButton.textContent =
                '✓ Copied';

            }
            catch (copyError) {

              alert(
                'Could not copy password. Please copy it manually.'
              );

            }


            document.body.removeChild(
              textArea
            );

          }

        }
      );

    }

  },


  // ==========================================
  // LOAD USERS
  // ==========================================

  async loadUsers() {

    const container =
      document.getElementById(
        'users-table-container'
      );


    if (!container) {

      return;

    }


    container.innerHTML = `

      <div class="py-8 text-center text-slate-500">

        Loading users...

      </div>

    `;


    try {

      const users =
        await API.get(
          '/api/auth/users'
        );


      this.renderUsersTable(
        container,
        users
      );

    }
    catch (error) {

      console.error(
        'Load users error:',
        error
      );


      container.innerHTML = `

        <div class="py-8 text-center">

          <p class="text-red-500 font-medium">
            Could not load users.
          </p>

          <p class="text-xs text-slate-500 mt-2">
            ${this.escapeHtml(
              error.message ||
              'Unknown error'
            )}
          </p>

          <button
            id="retry-load-users-btn"
            type="button"
            class="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
          >
            Try Again
          </button>

        </div>

      `;


      const retryButton =
        document.getElementById(
          'retry-load-users-btn'
        );


      if (retryButton) {

        retryButton.addEventListener(
          'click',
          () => this.loadUsers()
        );

      }

    }

  },


  // ==========================================
  // RENDER USERS TABLE
  // ==========================================

  renderUsersTable(
    container,
    users
  ) {

    if (!Array.isArray(users)) {

      users = [];

    }


    if (users.length === 0) {

      container.innerHTML = `

        <div class="py-8 text-center text-slate-500">

          No users found.

        </div>

      `;

      return;

    }


    const rows =
      users.map(
        user => {

          const roleClass =
            this.getRoleClass(
              user.role
            );


          const passwordStatus =
            user.mustChangePassword

              ? `
                <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Temporary password
                </span>
              `

              : `
                <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Password changed
                </span>
              `;


          return `

            <tr
              class="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30"
            >

              <!-- USER -->

              <td class="px-4 py-4">

                <div class="font-medium">

                  ${this.escapeHtml(
                    user.name || 'Unknown'
                  )}

                </div>

                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">

                  ${this.escapeHtml(
                    user.email || ''
                  )}

                </div>

              </td>


              <!-- ROLE -->

              <td class="px-4 py-4">

                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold ${roleClass}"
                >

                  ${this.formatRole(
                    user.role
                  )}

                </span>

              </td>


              <!-- PASSWORD STATUS -->

              <td class="px-4 py-4">

                ${passwordStatus}

              </td>


              <!-- RELIABILITY -->

              <td class="px-4 py-4 text-sm">

                <div class="flex items-center gap-2">

                  <span class="font-semibold">

                    ${Number(
                      user.reliabilityScore ?? 75
                    )}

                  </span>

                  <span class="text-slate-400">
                    / 100
                  </span>

                </div>

              </td>


              <!-- ACTION -->

              <td class="px-4 py-4">

                <button
                  type="button"
                  class="delete-user-btn px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
                  data-user-id="${this.escapeHtml(user.id || '')}"
                  data-user-name="${this.escapeHtml(user.name || user.email || 'this user')}"
                  data-user-email="${this.escapeHtml(user.email || '')}"
                >
                  🗑 Delete
                </button>

              </td>

            </tr>

          `;

        }
      ).join('');


    container.innerHTML = `

      <table class="w-full text-left">

        <thead>

          <tr
            class="border-b border-slate-200 dark:border-slate-700"
          >

            <th class="px-4 py-3 text-sm font-semibold">
              User
            </th>

            <th class="px-4 py-3 text-sm font-semibold">
              Role
            </th>

            <th class="px-4 py-3 text-sm font-semibold">
              Password Status
            </th>

            <th class="px-4 py-3 text-sm font-semibold">
              Reliability
            </th>

            <th class="px-4 py-3 text-sm font-semibold">
              Action
            </th>

          </tr>

        </thead>


        <tbody>

          ${rows}

        </tbody>

      </table>

    `;


    // ----------------------------------------
    // DELETE BUTTONS
    // ----------------------------------------

    const deleteButtons =
      container.querySelectorAll(
        '.delete-user-btn'
      );


    deleteButtons.forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const userId =
              button.dataset.userId;

            const userName =
              button.dataset.userName ||
              'this user';

            const userEmail =
              button.dataset.userEmail ||
              '';


            if (!userId) {

              alert(
                'Could not determine the user ID.'
              );

              return;

            }


            // --------------------------------
            // CONFIRMATION
            // --------------------------------

            const confirmed =
              window.confirm(
                `Are you sure you want to delete ${userName}${userEmail ? ` (${userEmail})` : ''}?\n\nThis action cannot be undone.`
              );


            if (!confirmed) {

              return;

            }


            // --------------------------------
            // DISABLE BUTTON
            // --------------------------------

            button.disabled =
              true;

            button.textContent =
              'Deleting...';


            try {

              // --------------------------------
              // DELETE USER
              // --------------------------------

              const data =
                await API.delete(
                  `/api/auth/users/${encodeURIComponent(userId)}`
                );


              alert(
                data?.message ||
                'User deleted successfully.'
              );


              // --------------------------------
              // RELOAD USERS
              // --------------------------------

              await this.loadUsers();

            }
            catch (error) {

              console.error(
                'Delete user error:',
                error
              );


              alert(
                error.message ||
                'Could not delete user.'
              );


              button.disabled =
                false;

              button.textContent =
                '🗑 Delete';

            }

          }
        );

      }
    );

  },


  // ==========================================
  // ROLE DISPLAY
  // ==========================================

  formatRole(role) {

    const roles = {

      student: 'Student',

      faculty: 'Faculty',

      lab_manager: 'Lab Manager',

      admin: 'Admin'

    };


    return roles[role] ||
      role ||
      'Unknown';

  },


  // ==========================================
  // ROLE CSS
  // ==========================================

  getRoleClass(role) {

    const classes = {

      student:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',

      faculty:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',

      lab_manager:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',

      admin:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'

    };


    return classes[role] ||
      'bg-slate-100 text-slate-700';

  },


  // ==========================================
  // HTML ESCAPE
  // ==========================================

  escapeHtml(value) {

    return String(value ?? '')

      .replace(
        /&/g,
        '&amp;'
      )

      .replace(
        /</g,
        '&lt;'
      )

      .replace(
        />/g,
        '&gt;'
      )

      .replace(
        /"/g,
        '&quot;'
      )

      .replace(
        /'/g,
        '&#039;'
      );

  }

};