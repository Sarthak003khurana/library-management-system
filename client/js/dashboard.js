// ============================================
// DASHBOARD.JS - Personal overview
// Stitch-inspired Tactile UI
//
// Functionality preserved:
// - Reservations
// - Fines
// - Waitlist
// - Reliability score
// - Recent activity
// - Due soon
// - Return item
// - Condition rating
// - Damage description
// ============================================

import { Components } from './components.js';
import { API } from './api.js';

export const Dashboard = {

  // ==========================================
  // RENDER DASHBOARD
  // ==========================================

  async render(container, user) {

    const [
      reservations,
      fines,
      waitlist
    ] = await Promise.all([

      API.get('/api/reservations'),

      API.get('/api/fines'),

      API.get('/api/waitlist')

    ]);


    // ========================================
    // CALCULATIONS
    // ========================================

    const active =
      reservations.filter(
        r => r.status === 'active'
      );


    const myWaitlist =
      waitlist.filter(
        w => w.userId === user.id
      );


    const unpaidFines =
      fines.filter(
        f => !f.paid
      );


    const totalFines =
      unpaidFines.reduce(
        (sum, f) => sum + Number(f.amount || 0),
        0
      );


    const now =
      Date.now();


    const dueSoon =
      active

        .map(
          r => ({

            ...r,

            daysLeft:
              Math.ceil(
                (
                  new Date(r.dueDate).getTime()
                  -
                  now
                ) / 86400000
              )

          })
        )

        .sort(
          (a, b) =>
            a.daysLeft - b.daysLeft
        )

        .slice(0, 5);


    const recent =
      [...reservations]

        .sort(
          (a, b) =>
            new Date(b.borrowedAt)
            -
            new Date(a.borrowedAt)
        )

        .slice(0, 5);


    // ========================================
    // USER INITIAL
    // ========================================

    const firstName =
      (user?.name || 'User')
        .split(' ')[0];


    // ========================================
    // DASHBOARD HTML
    // ========================================

    container.innerHTML = `

      <div
        class="
          space-y-8
          fade-in
        "
      >

        <!-- ================================= -->
        <!-- WELCOME HEADER -->
        <!-- ================================= -->

        <section
          class="
            relative
            overflow-hidden

            rounded-[28px]

            p-7
            md:p-9

            bg-gradient-to-br
            from-[#4648d4]
            via-[#5a43d2]
            to-[#8127cf]

            text-white

            shadow-[0_20px_45px_rgba(70,72,212,0.18)]
          "
        >

          <!-- Decorative circles -->

          <div
            class="
              absolute

              -right-20
              -top-24

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
              -right-8

              w-64
              h-64

              rounded-full

              bg-white/5

              blur-2xl
            "
          ></div>


          <div
            class="
              relative
              z-10

              flex
              flex-col
              md:flex-row

              md:items-center
              md:justify-between

              gap-6
            "
          >

            <div>

              <p
                class="
                  text-sm
                  text-white/70

                  font-medium

                  mb-2
                "
              >
                Personal Overview
              </p>


              <h1
                class="
                  text-3xl
                  md:text-4xl

                  font-bold

                  tracking-tight
                "
              >
                Welcome back,
                ${this.escapeHtml(firstName)}! 👋
              </h1>


              <p
                class="
                  mt-3

                  text-sm
                  md:text-base

                  text-white/75

                  max-w-xl
                "
              >
                Here's what's happening with your
                library and lab resources today.
              </p>

            </div>


            <!-- Reliability -->

            <div
              class="
                shrink-0

                px-5
                py-4

                rounded-2xl

                bg-white/10

                border
                border-white/15

                backdrop-blur-md
              "
            >

              <p
                class="
                  text-[10px]

                  uppercase

                  tracking-[0.15em]

                  text-white/60

                  font-bold
                "
              >
                Reliability
              </p>


              <div
                class="
                  flex
                  items-end

                  gap-2

                  mt-1
                "
              >

                <span
                  class="
                    text-3xl

                    font-bold
                  "
                >
                  ${Number(
                    user.reliabilityScore ?? 75
                  )}
                </span>


                <span
                  class="
                    text-sm

                    text-white/60

                    pb-1
                  "
                >
                  /100
                </span>

              </div>

            </div>

          </div>

        </section>


        <!-- ================================= -->
        <!-- STAT CARDS -->
        <!-- ================================= -->

        <section>

          <div
            class="
              flex
              items-center
              justify-between

              mb-4
            "
          >

            <div>

              <h2
                class="
                  text-lg

                  font-bold
                "
              >
                Your Overview
              </h2>


              <p
                class="
                  text-xs

                  text-slate-400

                  mt-0.5
                "
              >
                A quick look at your account
              </p>

            </div>

          </div>


          <div
            class="
              grid

              grid-cols-1
              sm:grid-cols-2
              xl:grid-cols-4

              gap-5
            "
          >

            ${Components.card({

              title:
                'Currently Borrowed',

              value:
                active.length,

              icon:
                '📚',

              color:
                'primary'

            })}


            ${Components.card({

              title:
                'Waitlist Entries',

              value:
                myWaitlist.length,

              icon:
                '⏳',

              color:
                'warning'

            })}


            ${Components.card({

              title:
                'Fines Due',

              value:
                `$${totalFines.toFixed(2)}`,

              icon:
                '💰',

              color:
                'danger'

            })}


            ${Components.card({

              title:
                'Reliability Score',

              value:
                `${user.reliabilityScore ?? 75}/100`,

              icon:
                '⭐',

              color:
                'success'

            })}

          </div>

        </section>


        <!-- ================================= -->
        <!-- QUICK ACTIONS -->
        <!-- ================================= -->

        <section
          class="
            rh-card

            p-6
            md:p-7
          "
        >

          <div
            class="
              flex
              items-center
              justify-between

              mb-6
            "
          >

            <div>

              <h2
                class="
                  text-lg

                  font-bold
                "
              >
                Quick Actions
              </h2>


              <p
                class="
                  text-xs

                  text-slate-400

                  mt-1
                "
              >
                Jump directly to what you need
              </p>

            </div>


            <span
              class="
                w-9
                h-9

                rounded-xl

                bg-indigo-50
                dark:bg-indigo-900/20

                text-[#4648d4]

                flex
                items-center
                justify-center
              "
            >
              ⚡
            </span>

          </div>


          <div
            class="
              grid

              grid-cols-2
              md:grid-cols-4

              gap-4
            "
          >

            ${[

              {
                icon:
                  '📚',

                label:
                  'Browse Catalog',

                description:
                  'Find resources',

                route:
                  '/catalog',

                classes:
                  'from-indigo-50 to-blue-50 text-indigo-600 dark:from-indigo-900/20 dark:to-blue-900/20 dark:text-indigo-300'
              },


              {
                icon:
                  '📅',

                label:
                  'Book Equipment',

                description:
                  'Reserve a resource',

                route:
                  '/timeline',

                classes:
                  'from-emerald-50 to-teal-50 text-emerald-600 dark:from-emerald-900/20 dark:to-teal-900/20 dark:text-emerald-300'
              },


              {
                icon:
                  '⏳',

                label:
                  'View Waitlist',

                description:
                  'Check your queue',

                route:
                  '/waitlist',

                classes:
                  'from-amber-50 to-orange-50 text-amber-600 dark:from-amber-900/20 dark:to-orange-900/20 dark:text-amber-300'
              },


              {
                icon:
                  '💳',

                label:
                  'Pay Fines',

                description:
                  'Manage payments',

                route:
                  '/fines',

                classes:
                  'from-rose-50 to-pink-50 text-rose-600 dark:from-rose-900/20 dark:to-pink-900/20 dark:text-rose-300'
              }

            ]

            .map(
              action => `

                <a

                  href="${action.route}"

                  data-route="${action.route}"

                  class="
                    group

                    relative

                    overflow-hidden

                    p-5

                    rounded-2xl

                    bg-gradient-to-br
                    ${action.classes}

                    border
                    border-white/70
                    dark:border-white/5

                    transition-all
                    duration-200

                    hover:-translate-y-1

                    hover:shadow-lg

                    cursor-pointer
                  "
                >

                  <div
                    class="
                      w-12
                      h-12

                      rounded-2xl

                      bg-white/80
                      dark:bg-slate-800/60

                      shadow-sm

                      flex
                      items-center
                      justify-center

                      text-2xl

                      mb-4

                      group-hover:scale-105

                      transition-transform
                    "
                  >
                    ${action.icon}
                  </div>


                  <p
                    class="
                      font-bold

                      text-sm

                      text-slate-800
                      dark:text-slate-100
                    "
                  >
                    ${action.label}
                  </p>


                  <p
                    class="
                      text-[11px]

                      text-slate-500
                      dark:text-slate-400

                      mt-1
                    "
                  >
                    ${action.description}
                  </p>


                  <span
                    class="
                      absolute

                      right-4
                      bottom-4

                      opacity-0
                      translate-x-1

                      group-hover:opacity-100
                      group-hover:translate-x-0

                      transition-all
                    "
                  >
                    →
                  </span>

                </a>

              `
            )
            .join('')}

          </div>

        </section>


        <!-- ================================= -->
        <!-- ACTIVITY + DUE SOON -->
        <!-- ================================= -->

        <section
          class="
            grid

            grid-cols-1
            xl:grid-cols-2

            gap-6
          "
        >

          <!-- ================================= -->
          <!-- RECENT ACTIVITY -->
          <!-- ================================= -->

          <div
            class="
              rh-card

              p-6
            "
          >

            <div
              class="
                flex
                items-center
                justify-between

                mb-6
              "
            >

              <div>

                <h2
                  class="
                    text-lg

                    font-bold
                  "
                >
                  Recent Activity
                </h2>


                <p
                  class="
                    text-xs

                    text-slate-400

                    mt-1
                  "
                >
                  Your latest reservations
                </p>

              </div>


              <span
                class="
                  w-9
                  h-9

                  rounded-xl

                  bg-purple-50
                  dark:bg-purple-900/20

                  text-purple-600
                  dark:text-purple-300

                  flex
                  items-center
                  justify-center
                "
              >
                🕒
              </span>

            </div>


            ${
              recent.length === 0

                ? `

                  <div
                    class="
                      py-12

                      text-center
                    "
                  >

                    <div
                      class="
                        w-14
                        h-14

                        mx-auto
                        mb-4

                        rounded-2xl

                        bg-slate-100
                        dark:bg-slate-800

                        flex
                        items-center
                        justify-center

                        text-2xl
                      "
                    >
                      📭
                    </div>


                    <p
                      class="
                        font-semibold
                      "
                    >
                      No activity yet
                    </p>


                    <p
                      class="
                        text-xs

                        text-slate-400

                        mt-1
                      "
                    >
                      Your recent reservations will appear here.
                    </p>

                  </div>

                `

                : `

                  <div
                    class="
                      space-y-1
                    "
                  >

                    ${recent.map(
                      (reservation, index) => `

                        <div
                          class="
                            flex
                            items-center

                            gap-4

                            p-3

                            rounded-2xl

                            hover:bg-slate-50
                            dark:hover:bg-slate-800/60

                            transition
                          "
                        >

                          <!-- ICON -->

                          <div
                            class="
                              w-11
                              h-11

                              shrink-0

                              rounded-2xl

                              ${
                                reservation.status === 'active'

                                  ? `
                                    bg-indigo-50
                                    dark:bg-indigo-900/20

                                    text-indigo-600
                                    dark:text-indigo-300
                                  `

                                  : `
                                    bg-emerald-50
                                    dark:bg-emerald-900/20

                                    text-emerald-600
                                    dark:text-emerald-300
                                  `
                              }

                              flex
                              items-center
                              justify-center

                              text-lg
                            "
                          >

                            ${
                              reservation.status === 'active'
                                ? '📥'
                                : '📤'
                            }

                          </div>


                          <!-- DETAILS -->

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
                              "
                            >
                              ${this.escapeHtml(
                                reservation.itemTitle ||
                                'Resource'
                              )}
                            </p>


                            <p
                              class="
                                text-xs

                                text-slate-400

                                mt-1
                              "
                            >
                              ${new Date(
                                reservation.borrowedAt
                              ).toLocaleDateString()}
                            </p>

                          </div>


                          <!-- STATUS -->

                          <span
                            class="
                              px-3
                              py-1.5

                              rounded-full

                              text-[10px]

                              font-bold

                              uppercase

                              tracking-wide

                              ${
                                reservation.status === 'active'

                                  ? `
                                    bg-amber-50
                                    text-amber-600

                                    dark:bg-amber-900/20
                                    dark:text-amber-300
                                  `

                                  : `
                                    bg-emerald-50
                                    text-emerald-600

                                    dark:bg-emerald-900/20
                                    dark:text-emerald-300
                                  `
                              }
                            "
                          >
                            ${reservation.status}
                          </span>

                        </div>

                      `
                    ).join('')}

                  </div>

                `
            }

          </div>


          <!-- ================================= -->
          <!-- DUE SOON -->
          <!-- ================================= -->

          <div
            class="
              rh-card

              p-6
            "
          >

            <div
              class="
                flex
                items-center
                justify-between

                mb-6
              "
            >

              <div>

                <h2
                  class="
                    text-lg

                    font-bold
                  "
                >
                  Due Soon
                </h2>


                <p
                  class="
                    text-xs

                    text-slate-400

                    mt-1
                  "
                >
                  Keep track of upcoming returns
                </p>

              </div>


              <span
                class="
                  w-9
                  h-9

                  rounded-xl

                  bg-amber-50
                  dark:bg-amber-900/20

                  text-amber-600
                  dark:text-amber-300

                  flex
                  items-center
                  justify-center
                "
              >
                ⏰
              </span>

            </div>


            ${
              dueSoon.length === 0

                ? `

                  <div
                    class="
                      py-12

                      text-center
                    "
                  >

                    <div
                      class="
                        w-14
                        h-14

                        mx-auto
                        mb-4

                        rounded-2xl

                        bg-emerald-50
                        dark:bg-emerald-900/20

                        flex
                        items-center
                        justify-center

                        text-2xl
                      "
                    >
                      🎉
                    </div>


                    <p
                      class="
                        font-semibold
                      "
                    >
                      Nothing due soon
                    </p>


                    <p
                      class="
                        text-xs

                        text-slate-400

                        mt-1
                      "
                    >
                      You're all caught up!
                    </p>

                  </div>

                `

                : `

                  <div
                    class="
                      space-y-3
                    "
                  >

                    ${dueSoon.map(
                      reservation => {

                        const urgency =
                          reservation.daysLeft <= 0

                            ? {
                                classes:
                                  'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300',

                                label:
                                  'OVERDUE'
                              }

                            : reservation.daysLeft <= 2

                              ? {
                                  classes:
                                    'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300',

                                  label:
                                    `${reservation.daysLeft}d left`
                                }

                              : {
                                  classes:
                                    'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300',

                                  label:
                                    `${reservation.daysLeft}d left`
                                };


                        return `

                          <div
                            class="
                              p-4

                              rounded-2xl

                              border
                              border-slate-100
                              dark:border-slate-700

                              bg-slate-50/60
                              dark:bg-slate-800/50

                              hover:-translate-y-0.5

                              hover:shadow-sm

                              transition-all
                            "
                          >

                            <div
                              class="
                                flex
                                flex-col
                                sm:flex-row

                                sm:items-center
                                sm:justify-between

                                gap-4
                              "
                            >

                              <!-- RESOURCE -->

                              <div
                                class="
                                  flex
                                  items-center

                                  gap-3

                                  min-w-0
                                "
                              >

                                <div
                                  class="
                                    w-10
                                    h-10

                                    shrink-0

                                    rounded-xl

                                    bg-white
                                    dark:bg-slate-800

                                    shadow-sm

                                    flex
                                    items-center
                                    justify-center
                                  "
                                >
                                  📚
                                </div>


                                <div
                                  class="
                                    min-w-0
                                  "
                                >

                                  <p
                                    class="
                                      font-semibold

                                      text-sm

                                      truncate
                                    "
                                  >
                                    ${this.escapeHtml(
                                      reservation.itemTitle ||
                                      'Resource'
                                    )}
                                  </p>


                                  <p
                                    class="
                                      text-xs

                                      text-slate-400

                                      mt-1
                                    "
                                  >
                                    Due
                                    ${new Date(
                                      reservation.dueDate
                                    ).toLocaleDateString()}
                                  </p>

                                </div>

                              </div>


                              <!-- ACTIONS -->

                              <div
                                class="
                                  flex

                                  items-center

                                  gap-2

                                  shrink-0
                                "
                              >

                                <span
                                  class="
                                    px-3
                                    py-1.5

                                    rounded-full

                                    text-[10px]

                                    font-bold

                                    uppercase

                                    tracking-wide

                                    ${urgency.classes}
                                  "
                                >
                                  ${urgency.label}
                                </span>


                                <button

                                  data-return="${reservation.id}"

                                  class="
                                    px-3.5
                                    py-2

                                    rounded-xl

                                    text-xs

                                    font-bold

                                    bg-slate-900
                                    dark:bg-slate-700

                                    text-white

                                    hover:-translate-y-0.5

                                    active:translate-y-0

                                    shadow-sm

                                    transition
                                  "
                                >
                                  Return
                                </button>

                              </div>

                            </div>

                          </div>

                        `;

                      }
                    ).join('')}

                  </div>

                `
            }

          </div>

        </section>

      </div>

    `;


    // ========================================
    // RETURN BUTTONS
    // ========================================

    container
      .querySelectorAll('[data-return]')
      .forEach(
        button => {

          button.addEventListener(
            'click',
            () =>
              this.openReturnModal(
                button.dataset.return,
                container,
                user
              )
          );

        }
      );

  },


  // ==========================================
  // RETURN MODAL
  // ==========================================

  openReturnModal(
    reservationId,
    container,
    user
  ) {

    Components.modal(`

      <div
        class="
          p-6
          md:p-7

          space-y-6
        "
      >

        <!-- HEADER -->

        <div
          class="
            flex
            items-start
            justify-between

            gap-4
          "
        >

          <div>

            <div
              class="
                w-11
                h-11

                rounded-2xl

                bg-emerald-50
                dark:bg-emerald-900/20

                text-emerald-600
                dark:text-emerald-300

                flex
                items-center
                justify-center

                text-xl

                mb-4
              "
            >
              📦
            </div>


            <h2
              class="
                text-2xl

                font-bold

                tracking-tight
              "
            >
              Return Item
            </h2>


            <p
              class="
                text-sm

                text-slate-500
                dark:text-slate-400

                mt-2

                leading-relaxed
              "
            >
              Rate the item's condition.
              Any late fee and condition-based
              damage fee are calculated automatically.
            </p>

          </div>

        </div>


        <!-- CONDITION -->

        <div
          class="
            p-5

            rounded-2xl

            bg-slate-50
            dark:bg-slate-800/70

            border
            border-slate-100
            dark:border-slate-700
          "
        >

          <div
            class="
              flex
              items-center
              justify-between

              mb-4
            "
          >

            <label
              for="condition-rating"

              class="
                text-sm

                font-bold
              "
            >
              Condition Rating
            </label>


            <span
              class="
                px-3
                py-1

                rounded-full

                bg-indigo-50
                dark:bg-indigo-900/20

                text-[#4648d4]
                dark:text-indigo-300

                text-sm

                font-bold
              "
            >
              <span id="rating-value">
                9
              </span>
              / 10
            </span>

          </div>


          <input

            type="range"

            id="condition-rating"

            min="1"

            max="10"

            value="9"

            class="
              w-full

              accent-[#4648d4]

              cursor-pointer
            "
          />


          <div
            class="
              flex
              justify-between

              text-[11px]

              text-slate-400

              mt-2
            "
          >

            <span>
              Poor
            </span>

            <span>
              Excellent
            </span>

          </div>

        </div>


        <!-- DAMAGE -->

        <div>

          <label
            for="damage-desc"

            class="
              block

              text-sm

              font-bold

              mb-2
            "
          >
            Damage Description
            <span
              class="
                text-slate-400
                font-normal
              "
            >
              (optional)
            </span>
          </label>


          <textarea

            id="damage-desc"

            rows="4"

            class="
              rh-input

              resize-none
            "

            placeholder="Describe any damage or issues..."
          ></textarea>

        </div>


        <!-- ACTIONS -->

        <div
          class="
            flex
            justify-end

            gap-3

            pt-2
          "
        >

          <button

            onclick="closeModal()"

            class="
              rh-btn
              rh-btn-secondary

              !px-5
            "
          >
            Cancel
          </button>


          <button

            id="confirm-return"

            class="
              rh-btn

              !from-emerald-500
              !to-teal-500

              !border-emerald-200
            "
          >
            ✓ Confirm Return
          </button>

        </div>

      </div>

    `);


    // ========================================
    // RATING SLIDER
    // ========================================

    const rating =
      document.getElementById(
        'condition-rating'
      );


    const ratingValue =
      document.getElementById(
        'rating-value'
      );


    if (rating && ratingValue) {

      rating.addEventListener(
        'input',
        event => {

          ratingValue.textContent =
            event.target.value;

        }
      );

    }


    // ========================================
    // CONFIRM RETURN
    // ========================================

    const confirmButton =
      document.getElementById(
        'confirm-return'
      );


    if (confirmButton) {

      confirmButton.addEventListener(
        'click',
        async () => {

          const conditionRating =
            document.getElementById(
              'condition-rating'
            )?.value;


          const damageDescription =
            document.getElementById(
              'damage-desc'
            )?.value || '';


          confirmButton.disabled =
            true;

          confirmButton.textContent =
            'Returning...';


          try {

            const result =
              await API.post(
                `/api/reservations/${reservationId}/return`,
                {
                  conditionRating,
                  damageDescription
                }
              );


            window.closeModal();


            Components.showToast(

              result.totalFine > 0

                ? `Returned — fine of $${Number(result.totalFine).toFixed(2)} applied`

                : 'Returned — no fine!',

              'success'

            );


            await this.render(
              container,
              user
            );

          }
          catch (error) {

            Components.showToast(
              error.message ||
              'Could not return item.',
              'error'
            );


            confirmButton.disabled =
              false;

            confirmButton.textContent =
              '✓ Confirm Return';

          }

        }
      );

    }

  },


  // ==========================================
  // HTML ESCAPE
  // ==========================================

  escapeHtml(value) {

    return String(
      value ?? ''
    )

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