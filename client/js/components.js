// ============================================
// COMPONENTS.JS - Reusable UI building blocks
// ============================================
// ResourceHub Tactile / Stitch-inspired UI
//
// Keeps:
// - Existing routes
// - Existing IDs
// - Existing authentication hooks
// - Existing dark-mode toggle
// - Existing logout button
// - Existing modal/toast functionality
// ============================================

export const Components = {

  // ============================================
  // SIDEBAR - ROLE BASED
  // ============================================

  sidebar(user) {

    const role =
      user?.role || 'student';


    // ------------------------------------------
    // COMMON NAVIGATION
    // ------------------------------------------

    const commonItems = [

      {
        route: '/',
        icon: '📊',
        label: 'Dashboard'
      },

      {
        route: '/catalog',
        icon: '📚',
        label: 'Browse Items'
      },

      {
        route: '/timeline',
        icon: '📅',
        label: 'Booking Timeline'
      },

      {
        route: '/waitlist',
        icon: '⏳',
        label: 'Waitlist'
      },

      {
        route: '/fines',
        icon: '💰',
        label: 'Fines'
      }

    ];


    // ------------------------------------------
    // STUDENT
    // ------------------------------------------

    const studentItems = [
      ...commonItems
    ];


    // ------------------------------------------
    // FACULTY
    // ------------------------------------------

    const facultyItems = [
      ...commonItems
    ];


    // ------------------------------------------
    // ADMIN
    // ------------------------------------------

    const adminItems = [

      ...commonItems,

      {
        route: '/admin',
        icon: '📈',
        label: 'Analytics'
      },

      {
        route: '/admin/items',
        icon: '⚙️',
        label: 'Manage Items'
      },

      {
        route: '/admin/users',
        icon: '👥',
        label: 'Manage Users'
      }

    ];


    // ------------------------------------------
    // LAB MANAGER
    // ------------------------------------------

    const labManagerItems = [

      ...commonItems,

      {
        route: '/admin',
        icon: '📈',
        label: 'Analytics'
      },

      {
        route: '/admin/items',
        icon: '🔧',
        label: 'Manage Items'
      }

    ];


    // ------------------------------------------
    // SELECT NAVIGATION
    // ------------------------------------------

    let items =
      studentItems;


    if (role === 'faculty') {

      items =
        facultyItems;

    }

    else if (role === 'admin') {

      items =
        adminItems;

    }

    else if (role === 'lab_manager') {

      items =
        labManagerItems;

    }


    // ------------------------------------------
    // CURRENT ROUTE
    // ------------------------------------------

    const current =
      window.location.pathname;


    // ------------------------------------------
    // ROLE DISPLAY
    // ------------------------------------------

    const roleNames = {

      student:
        'Student',

      faculty:
        'Faculty',

      admin:
        'Administrator',

      lab_manager:
        'Lab Manager'

    };


    const roleName =
      roleNames[role] ||
      'Student';


    // ------------------------------------------
    // ROLE COLORS
    // ------------------------------------------

    const roleAccent = {

      student:
        'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300',

      faculty:
        'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300',

      admin:
        'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',

      lab_manager:
        'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300'

    };


    const roleBadge =
      roleAccent[role] ||
      roleAccent.student;


    // ------------------------------------------
    // USER NAME
    // ------------------------------------------

    const name =
      user?.name ||
      'User';


    // ------------------------------------------
    // INITIALS
    // ------------------------------------------

    const initials = name
      .split(' ')
      .map(
        word => word[0]
      )
      .join('')
      .slice(0, 2)
      .toUpperCase();


    // ==========================================
    // SIDEBAR HTML
    // ==========================================

    return `

      <aside

        class="
          fixed
          left-4
          top-4
          bottom-4

          w-64

          bg-white/90
          dark:bg-slate-900/90

          backdrop-blur-xl

          border
          border-white
          dark:border-slate-700

          rounded-3xl

          shadow-[0_20px_50px_rgba(15,23,42,0.10)]

          flex
          flex-col

          z-30

          overflow-hidden
        "

      >

        <!-- ================================= -->
        <!-- LOGO -->
        <!-- ================================= -->

        <div
          class="
            px-6
            py-6

            border-b
            border-slate-100
            dark:border-slate-800
          "
        >

          <div class="flex items-center gap-3">

            <!-- LOGO MARK -->

            <div
              class="
                w-11
                h-11

                rounded-2xl

                bg-gradient-to-br
                from-[#4648d4]
                to-[#8127cf]

                flex
                items-center
                justify-center

                text-white

                text-xl

                shadow-[0_8px_18px_rgba(70,72,212,0.25)]

                select-none
              "
            >

              📚

            </div>


            <!-- BRAND -->

            <div>

              <h1
                class="
                  text-xl
                  font-bold

                  tracking-tight

                  bg-gradient-to-r
                  from-[#4648d4]
                  to-[#8127cf]

                  bg-clip-text
                  text-transparent
                "
              >
                ResourceHub
              </h1>


              <p
                class="
                  text-[10px]
                  text-slate-400

                  mt-0.5

                  tracking-wide
                "
              >
                LIBRARY & LAB
              </p>

            </div>

          </div>

        </div>


        <!-- ================================= -->
        <!-- ROLE INDICATOR -->
        <!-- ================================= -->

        <div class="px-4 pt-4">

          <div
            class="
              px-4
              py-3

              rounded-2xl

              ${roleBadge}

              border
              border-black/5
              dark:border-white/5

              shadow-sm
            "
          >

            <p
              class="
                text-[10px]

                uppercase

                tracking-[0.12em]

                font-semibold

                opacity-60
              "
            >
              Logged in as
            </p>


            <p
              class="
                text-sm

                font-bold

                mt-0.5
              "
            >
              ${roleName}
            </p>

          </div>

        </div>


        <!-- ================================= -->
        <!-- NAVIGATION -->
        <!-- ================================= -->

        <nav
          class="
            flex-1

            px-4
            py-5

            space-y-1.5

            overflow-y-auto
          "
        >

          <p
            class="
              px-3
              mb-3

              text-[10px]

              uppercase

              tracking-[0.14em]

              font-bold

              text-slate-400
            "
          >
            Navigation
          </p>


          ${items.map(
            item => `

              <a

                href="${item.route}"

                data-route="${item.route}"

                class="
                  rh-floating-nav-item

                  flex
                  items-center
                  gap-3

                  px-3.5
                  py-3

                  rounded-2xl

                  text-slate-600
                  dark:text-slate-300

                  transition-all

                  duration-200

                  ${
                    current === item.route

                      ? `
                        bg-gradient-to-r
                        from-indigo-50
                        to-purple-50

                        dark:from-indigo-900/30
                        dark:to-purple-900/20

                        text-[#4648d4]
                        dark:text-indigo-300

                        shadow-sm

                        translate-x-1
                      `

                      : `
                        hover:bg-slate-50
                        dark:hover:bg-slate-800

                        hover:translate-x-1
                      `
                  }
                "
              >

                <!-- ICON -->

                <span

                  class="
                    w-9
                    h-9

                    rounded-xl

                    flex
                    items-center
                    justify-center

                    text-lg

                    ${
                      current === item.route

                        ? `
                          bg-white
                          dark:bg-slate-800

                          shadow-sm
                        `

                        : ''
                    }
                  "

                >
                  ${item.icon}
                </span>


                <!-- LABEL -->

                <span
                  class="
                    font-semibold
                    text-sm
                  "
                >
                  ${item.label}
                </span>


                ${
                  current === item.route

                    ? `
                      <span
                        class="
                          ml-auto

                          w-1.5
                          h-6

                          rounded-full

                          bg-gradient-to-b
                          from-[#4648d4]
                          to-[#8127cf]
                        "
                      ></span>
                    `

                    : ''
                }

              </a>

            `
          ).join('')}

        </nav>


        <!-- ================================= -->
        <!-- USER SECTION -->
        <!-- ================================= -->

        <div
          class="
            p-4

            border-t
            border-slate-100
            dark:border-slate-800

            bg-slate-50/60
            dark:bg-slate-900/60
          "
        >

          <div
            class="
              flex
              items-center
              gap-3
            "
          >

            <!-- AVATAR -->

            <div
              class="
                w-11
                h-11

                rounded-2xl

                bg-gradient-to-br
                from-[#4648d4]
                to-[#8127cf]

                flex
                items-center
                justify-center

                text-white

                font-bold

                text-sm

                shadow-[0_6px_15px_rgba(70,72,212,0.20)]

                shrink-0
              "
            >
              ${initials}
            </div>


            <!-- USER INFO -->

            <div
              class="
                flex-1
                min-w-0
              "
            >

              <p
                class="
                  font-semibold

                  text-sm

                  truncate

                  text-slate-800
                  dark:text-slate-100
                "
              >
                ${user?.name || 'User'}
              </p>


              <p
                class="
                  text-[11px]

                  text-slate-400

                  truncate

                  mt-0.5
                "
              >
                ${user?.email || ''}
              </p>

            </div>


            <!-- DARK MODE -->

            <button
              id="dark-mode-toggle"

              title="Toggle dark mode"

              class="
                w-9
                h-9

                rounded-xl

                bg-white
                dark:bg-slate-800

                border
                border-slate-200
                dark:border-slate-700

                shadow-sm

                hover:-translate-y-0.5

                active:translate-y-0

                transition

                flex
                items-center
                justify-center
              "
            >
              🌓
            </button>

          </div>


          <!-- ROLE -->

          <div
            class="
              mt-3

              px-3

              py-2

              rounded-xl

              bg-white
              dark:bg-slate-800

              border
              border-slate-100
              dark:border-slate-700

              flex
              items-center
              justify-between
            "
          >

            <span
              class="
                text-[11px]
                text-slate-400
              "
            >
              Role
            </span>


            <span
              class="
                text-[11px]
                font-bold
                capitalize

                text-slate-700
                dark:text-slate-200
              "
            >
              ${roleName}
            </span>

          </div>


          <!-- LOGOUT -->

          <button
            id="logout-btn"

            class="
              mt-3

              w-full

              py-2.5

              rounded-xl

              text-xs
              font-semibold

              text-slate-500
              dark:text-slate-400

              hover:text-rose-500

              hover:bg-rose-50
              dark:hover:bg-rose-900/20

              transition-all
            "
          >
            ↪ Sign out
          </button>

        </div>

      </aside>

    `;

  },


  // ============================================
  // LOGIN FORM
  // ============================================

  authForm() {

    const div =
      document.createElement(
        'div'
      );


    div.className =
      'min-h-screen w-full bg-[#f8f9ff] dark:bg-[#111222]';


    div.innerHTML = `

      <div
        class="
          min-h-screen

          flex
          items-center
          justify-center

          p-5
          md:p-8

          relative
          overflow-hidden
        "
      >

        <!-- ================================= -->
        <!-- BACKGROUND DECORATION -->
        <!-- ================================= -->

        <div
          class="
            absolute
            -top-32
            -left-32

            w-96
            h-96

            rounded-full

            bg-indigo-200/30

            blur-3xl

            pointer-events-none
          "
        ></div>


        <div
          class="
            absolute
            -bottom-32
            -right-32

            w-96
            h-96

            rounded-full

            bg-purple-200/30

            blur-3xl

            pointer-events-none
          "
        ></div>


        <!-- ================================= -->
        <!-- LOGIN CARD -->
        <!-- ================================= -->

        <div
          class="
            relative

            w-full
            max-w-5xl

            min-h-[620px]

            grid
            grid-cols-1
            lg:grid-cols-2

            bg-white
            dark:bg-slate-900

            rounded-[28px]

            overflow-hidden

            border
            border-white
            dark:border-slate-700

            shadow-[0_30px_80px_rgba(70,72,212,0.13)]
          "
        >

          <!-- ================================= -->
          <!-- LEFT BRAND PANEL -->
          <!-- ================================= -->

          <div
            class="
              hidden
              lg:flex

              relative

              overflow-hidden

              bg-gradient-to-br
              from-[#4648d4]
              via-[#5a3fd0]
              to-[#8127cf]

              p-12

              items-center
            "
          >

            <!-- DECORATIVE CIRCLES -->

            <div
              class="
                absolute
                -top-24
                -right-24

                w-72
                h-72

                rounded-full

                border
                border-white/10
              "
            ></div>


            <div
              class="
                absolute
                -bottom-32
                -left-32

                w-80
                h-80

                rounded-full

                border
                border-white/10
              "
            ></div>


            <div
              class="
                absolute
                top-1/2
                right-10

                w-16
                h-16

                rounded-2xl

                bg-white/10

                rotate-12

                backdrop-blur-sm
              "
            ></div>


            <div
              class="
                relative
                z-10

                text-white

                max-w-md
              "
            >

              <!-- BRAND -->

              <div class="flex items-center gap-4 mb-8">

                <div
                  class="
                    w-16
                    h-16

                    rounded-2xl

                    bg-white/15

                    border
                    border-white/20

                    backdrop-blur-md

                    flex
                    items-center
                    justify-center

                    text-3xl

                    shadow-lg
                  "
                >
                  📚
                </div>


                <div>

                  <h2
                    class="
                      text-3xl

                      font-bold

                      tracking-tight
                    "
                  >
                    ResourceHub
                  </h2>


                  <p
                    class="
                      text-xs

                      text-white/65

                      tracking-[0.16em]

                      mt-1
                    "
                  >
                    LIBRARY & LAB
                  </p>

                </div>

              </div>


              <h3
                class="
                  text-4xl

                  font-bold

                  leading-tight

                  mb-5
                "
              >
                Everything you need,
                <span class="text-white/70">
                  all in one place.
                </span>
              </h3>


              <p
                class="
                  text-white/75

                  leading-relaxed

                  text-base
                "
              >
                Book books and lab equipment,
                track reservations, manage fines,
                and stay organized with ResourceHub.
              </p>


              <!-- FEATURES -->

              <div
                class="
                  mt-10

                  space-y-4
                "
              >

                <div
                  class="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <span
                    class="
                      w-10
                      h-10

                      rounded-xl

                      bg-white/10

                      border
                      border-white/10

                      flex
                      items-center
                      justify-center
                    "
                  >
                    📅
                  </span>

                  <span
                    class="
                      text-sm
                      text-white/85
                    "
                  >
                    Visual time-slot booking
                  </span>

                </div>


                <div
                  class="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <span
                    class="
                      w-10
                      h-10

                      rounded-xl

                      bg-white/10

                      border
                      border-white/10

                      flex
                      items-center
                      justify-center
                    "
                  >
                    ⏳
                  </span>

                  <span
                    class="
                      text-sm
                      text-white/85
                    "
                  >
                    Transparent priority waitlist
                  </span>

                </div>


                <div
                  class="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <span
                    class="
                      w-10
                      h-10

                      rounded-xl

                      bg-white/10

                      border
                      border-white/10

                      flex
                      items-center
                      justify-center
                    "
                  >
                    📈
                  </span>

                  <span
                    class="
                      text-sm
                      text-white/85
                    "
                  >
                    Powerful analytics dashboard
                  </span>

                </div>

              </div>

            </div>

          </div>


          <!-- ================================= -->
          <!-- RIGHT LOGIN PANEL -->
          <!-- ================================= -->

          <div
            class="
              flex

              items-center
              justify-center

              p-7
              sm:p-10
              lg:p-12
            "
          >

            <div
              class="
                w-full
                max-w-md

                space-y-7
              "
            >

              <!-- MOBILE LOGO -->

              <div
                class="
                  lg:hidden

                  flex
                  items-center
                  gap-3

                  mb-8
                "
              >

                <div
                  class="
                    w-11
                    h-11

                    rounded-2xl

                    bg-gradient-to-br
                    from-[#4648d4]
                    to-[#8127cf]

                    flex
                    items-center
                    justify-center

                    text-white
                  "
                >
                  📚
                </div>


                <div>

                  <h2
                    class="
                      text-xl
                      font-bold
                    "
                  >
                    ResourceHub
                  </h2>


                  <p
                    class="
                      text-[10px]
                      text-slate-400

                      tracking-wider
                    "
                  >
                    LIBRARY & LAB
                  </p>

                </div>

              </div>


              <!-- TITLE -->

              <div>

                <h1
                  class="
                    text-3xl

                    font-bold

                    tracking-tight
                  "

                  id="auth-title"
                >
                  Welcome Back
                </h1>


                <p
                  class="
                    text-slate-500
                    dark:text-slate-400

                    mt-2

                    text-sm
                  "

                  id="auth-subtitle"
                >
                  Sign in to your account
                </p>

              </div>


              <!-- LOGIN FORM -->

              <form
                id="login-form"

                class="space-y-5"
              >

                <!-- EMAIL -->

                <div>

                  <label
                    for="email"

                    class="
                      block

                      text-xs

                      font-bold

                      uppercase

                      tracking-wide

                      text-slate-500
                      dark:text-slate-400

                      mb-2
                    "
                  >
                    Email
                  </label>


                  <input
                    type="email"

                    id="email"

                    required

                    autocomplete="email"

                    class="
                      rh-input
                    "

                    placeholder="you@university.edu"
                  />

                </div>


                <!-- PASSWORD -->

                <div>

                  <div
                    class="
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <label
                      for="password"

                      class="
                        block

                        text-xs

                        font-bold

                        uppercase

                        tracking-wide

                        text-slate-500
                        dark:text-slate-400

                        mb-2
                      "
                    >
                      Password
                    </label>

                  </div>


                  <input
                    type="password"

                    id="password"

                    required

                    autocomplete="current-password"

                    class="
                      rh-input
                    "

                    placeholder="••••••••"
                  />

                </div>


                <!-- LOGIN -->

                <button
                  type="submit"

                  id="auth-submit"

                  class="
                    rh-btn

                    w-full

                    min-h-[48px]

                    text-sm
                  "
                >
                  <span>
                    Sign In
                  </span>

                  <span>
                    →
                  </span>

                </button>


                <!-- GOOGLE DIVIDER -->

                <div
                  class="
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    class="
                      flex-1
                      h-px

                      bg-slate-200
                      dark:bg-slate-700
                    "
                  ></div>


                  <span
                    class="
                      text-[10px]

                      text-slate-400

                      font-bold

                      tracking-widest
                    "
                  >
                    OR
                  </span>


                  <div
                    class="
                      flex-1
                      h-px

                      bg-slate-200
                      dark:bg-slate-700
                    "
                  ></div>

                </div>


                <!-- GOOGLE -->

                <button
                  type="button"

                  id="google-login-btn"

                  class="
                    rh-btn

                    rh-btn-secondary

                    w-full

                    min-h-[48px]

                    !text-slate-700
                    dark:!text-slate-200

                    !bg-white
                    dark:!bg-slate-800
                  "
                >

                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >

                    <path
                      fill="#4285F4"
                      d="M21.35 12.27c0-.71-.06-1.39-.18-2.05H12v3.88h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.19z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 21.8c2.63 0 4.84-.87 6.45-2.34l-3.14-2.43c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.51A9.74 9.74 0 0 0 12 21.8z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M6.54 13.93A5.85 5.85 0 0 1 6.23 12c0-.67.12-1.32.31-1.93V7.56H3.3A9.78 9.78 0 0 0 2.2 12c0 1.58.38 3.07 1.1 4.44l3.24-2.51z"
                    />

                    <path
                      fill="#EA4335"
                      d="M12 6.04c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.13 14.63 2.2 12 2.2a9.74 9.74 0 0 0-8.7 5.36l3.24 2.51C7.31 7.76 9.46 6.04 12 6.04z"
                    />

                  </svg>


                  <span>
                    Continue with Google
                  </span>

                </button>

              </form>


              <!-- ACCOUNT NOTICE -->

              <div
                class="
                  p-4

                  rounded-2xl

                  bg-indigo-50/70
                  dark:bg-indigo-900/15

                  border
                  border-indigo-100
                  dark:border-indigo-900/30
                "
              >

                <p
                  class="
                    text-sm

                    font-semibold

                    text-indigo-900
                    dark:text-indigo-200
                  "
                >
                  New to ResourceHub?
                </p>


                <p
                  class="
                    text-xs

                    leading-relaxed

                    text-indigo-700
                    dark:text-indigo-300

                    mt-1
                  "
                >
                  Your account must be created by an administrator.
                  You will receive a temporary password by email.
                </p>

              </div>


              <!-- DEMO ACCOUNTS -->

              <div
                class="
                  p-4

                  rounded-2xl

                  bg-slate-50
                  dark:bg-slate-800/70

                  border
                  border-slate-100
                  dark:border-slate-700
                "
              >

                <p
                  class="
                    text-xs

                    font-bold

                    text-slate-600
                    dark:text-slate-300

                    mb-2
                  "
                >
                  Demo accounts
                </p>


                <div
                  class="
                    text-[11px]

                    text-slate-500
                    dark:text-slate-400

                    space-y-1
                  "
                >

                  <p>
                    alice@uni.edu — Student
                  </p>

                  <p>
                    bob@uni.edu — Faculty
                  </p>

                  <p>
                    carol@uni.edu — Admin
                  </p>

                  <p>
                    dave@uni.edu — Lab Manager
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    `;


    return div;

  },


  // ============================================
  // CARD
  // ============================================

  card({
    title,
    value,
    icon,
    color = 'primary'
  }) {

    const colors = {

      primary:
        'bg-indigo-50 text-[#4648d4] dark:bg-indigo-900/20 dark:text-indigo-300',

      success:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',

      warning:
        'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',

      danger:
        'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300'

    };


    return `

      <div
        class="
          rh-stat-card
        "
      >

        <div
          class="
            relative
            z-10

            flex
            items-start
            justify-between
          "
        >

          <div>

            <p
              class="
                text-xs

                font-bold

                uppercase

                tracking-wide

                text-slate-400
              "
            >
              ${title}
            </p>


            <h3
              class="
                text-3xl

                font-bold

                tracking-tight

                mt-2
              "
            >
              ${value}
            </h3>

          </div>


          <div
            class="
              w-12
              h-12

              rounded-2xl

              ${colors[color]}

              flex
              items-center
              justify-center

              text-xl

              shadow-sm
            "
          >
            ${icon}
          </div>

        </div>

      </div>

    `;

  },


  // ============================================
  // TOAST
  // ============================================

  showToast(
    message,
    type = 'info'
  ) {

    const container =
      document.getElementById(
        'toast-container'
      );


    if (!container) {

      return;

    }


    const toast =
      document.createElement(
        'div'
      );


    const colors = {

      success:
        'bg-emerald-500',

      error:
        'bg-rose-500',

      warning:
        'bg-amber-500',

      info:
        'bg-[#4648d4]'

    };


    toast.className = `

      ${colors[type] || colors.info}

      text-white

      px-5
      py-3

      rounded-2xl

      shadow-[0_15px_30px_rgba(15,23,42,0.15)]

      transform
      translate-x-full

      transition-transform
      duration-300

      flex
      items-center

      gap-3

      font-medium

      text-sm

      border
      border-white/10
    `;


    toast.innerHTML = `

      <span
        class="
          w-7
          h-7

          rounded-lg

          bg-white/15

          flex
          items-center
          justify-center
        "
      >

        ${
          type === 'success'
            ? '✓'
            : type === 'error'
              ? '✕'
              : type === 'warning'
                ? '!'
                : 'ℹ'
        }

      </span>


      <span>
        ${message}
      </span>

    `;


    container.appendChild(
      toast
    );


    requestAnimationFrame(
      () => {

        toast.classList.remove(
          'translate-x-full'
        );

      }
    );


    setTimeout(
      () => {

        toast.classList.add(
          'translate-x-full'
        );


        setTimeout(
          () => toast.remove(),
          300
        );

      },
      3000
    );

  },


  // ============================================
  // MODAL
  // ============================================

  modal(content) {

    const modalContent =
      document.getElementById(
        'modal-content'
      );


    if (!modalContent) {

      return;

    }


    modalContent.innerHTML = `

      <div
        class="
          bg-white
          dark:bg-slate-900

          rounded-[24px]

          border
          border-slate-100
          dark:border-slate-700

          shadow-[0_30px_80px_rgba(15,23,42,0.20)]

          max-h-[90vh]

          overflow-y-auto

          fade-in
        "
      >

        ${content}

      </div>

    `;


    const modalContainer =
      document.getElementById(
        'modal-container'
      );


    if (modalContainer) {

      modalContainer.classList.remove(
        'hidden'
      );

    }

  }

};


// ============================================
// GLOBAL MODAL CLOSE
// ============================================

window.closeModal = () => {

  const modalContainer =
    document.getElementById(
      'modal-container'
    );


  if (modalContainer) {

    modalContainer.classList.add(
      'hidden'
    );

  }

};