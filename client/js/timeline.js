// ============================================
// TIMELINE.JS - Visual equipment booking calendar
// ============================================
// Stitch-inspired Tactile UI
//
// Functionality preserved:
// - 14-day equipment timeline
// - Today detection
// - Booking status detection
// - Your booking / other booking / overdue
// - Click available slot
// - Start/end date reservation
// - Reservation API
// ============================================

import { Components } from './components.js';
import { API } from './api.js';


export const Timeline = {

  // ==========================================
  // RENDER
  // ==========================================

  async render(container, user) {

    const [
      items,
      reservations
    ] = await Promise.all([

      API.get('/api/items?type=equipment'),

      API.get('/api/reservations?all=true')
        .catch(
          () =>
            API.get('/api/reservations')
        )

    ]);


    const days =
      this.generateDays(14);


    // ========================================
    // HEADER
    // ========================================

    container.innerHTML = `

      <div
        class="
          space-y-7
          fade-in
        "
      >

        <!-- ================================= -->
        <!-- HEADER -->
        <!-- ================================= -->

        <section
          class="
            relative
            overflow-hidden

            rounded-[28px]

            p-7
            md:p-8

            bg-gradient-to-br
            from-[#4648d4]
            via-[#5a43d2]
            to-[#8127cf]

            text-white

            shadow-[0_20px_45px_rgba(70,72,212,0.18)]
          "
        >

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
              right-24
              -bottom-24

              w-56
              h-56

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
              lg:flex-row

              lg:items-center
              lg:justify-between

              gap-6
            "
          >

            <div>

              <div
                class="
                  flex
                  items-center
                  gap-3

                  mb-3
                "
              >

                <div
                  class="
                    w-10
                    h-10

                    rounded-xl

                    bg-white/10

                    border
                    border-white/15

                    backdrop-blur-sm

                    flex
                    items-center
                    justify-center

                    text-xl
                  "
                >
                  📅
                </div>


                <span
                  class="
                    text-xs

                    uppercase

                    tracking-[0.15em]

                    font-bold

                    text-white/60
                  "
                >
                  Equipment Booking
                </span>

              </div>


              <h1
                class="
                  text-3xl
                  md:text-4xl

                  font-bold

                  tracking-tight
                "
              >
                Booking Timeline
              </h1>


              <p
                class="
                  mt-2

                  text-sm
                  md:text-base

                  text-white/70
                "
              >
                Check equipment availability and
                reserve a time slot.
              </p>

            </div>


            <!-- DAYS -->

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

                  tracking-[0.14em]

                  font-bold

                  text-white/55
                "
              >
                Showing
              </p>


              <p
                class="
                  text-2xl

                  font-bold

                  mt-1
                "
              >
                14 Days
              </p>

            </div>

          </div>

        </section>


        <!-- ================================= -->
        <!-- LEGEND -->
        <!-- ================================= -->

        <section
          class="
            rh-card

            px-5
            py-4
          "
        >

          <div
            class="
              flex
              flex-wrap

              items-center

              gap-x-6
              gap-y-3
            "
          >

            <span
              class="
                text-xs

                font-bold

                uppercase

                tracking-wide

                text-slate-400
              "
            >
              Availability
            </span>


            ${this.legendItem(
              'bg-emerald-400',
              'Available'
            )}


            ${this.legendItem(
              'bg-[#4648d4]',
              'Your booking'
            )}


            ${this.legendItem(
              'bg-slate-400',
              'Booked'
            )}


            ${this.legendItem(
              'bg-rose-500',
              'Overdue'
            )}

          </div>

        </section>


        <!-- ================================= -->
        <!-- TIMELINE -->
        <!-- ================================= -->

        <section
          class="
            rh-card

            overflow-hidden
          "
        >

          <div
            class="
              overflow-x-auto
            "
          >

            <div
              class="
                min-w-[1100px]
              "
            >

              <!-- ================================= -->
              <!-- DATE HEADER -->
              <!-- ================================= -->

              <div
                class="
                  grid

                  grid-cols-[250px_repeat(14,minmax(60px,1fr))]

                  bg-slate-50/80
                  dark:bg-slate-900/70

                  border-b
                  border-slate-200
                  dark:border-slate-700
                "
              >

                <!-- EQUIPMENT -->

                <div
                  class="
                    p-4

                    flex
                    items-center

                    sticky
                    left-0

                    z-10

                    bg-slate-50
                    dark:bg-slate-900

                    border-r
                    border-slate-200
                    dark:border-slate-700
                  "
                >

                  <div>

                    <p
                      class="
                        text-[10px]

                        uppercase

                        tracking-[0.14em]

                        font-bold

                        text-slate-400
                      "
                    >
                      Resources
                    </p>


                    <p
                      class="
                        text-sm

                        font-bold

                        mt-1
                      "
                    >
                      Equipment
                    </p>

                  </div>

                </div>


                <!-- DAYS -->

                ${days
                  .map(
                    day => {

                      const today =
                        this.isToday(day);


                      return `

                        <div
                          class="
                            p-3

                            text-center

                            border-l
                            border-slate-200
                            dark:border-slate-700

                            ${
                              today
                                ? `
                                  bg-indigo-50
                                  dark:bg-indigo-900/20
                                `
                                : ''
                            }
                          "
                        >

                          <div
                            class="
                              w-9
                              h-9

                              mx-auto

                              rounded-xl

                              flex
                              flex-col

                              items-center
                              justify-center

                              ${
                                today
                                  ? `
                                    bg-[#4648d4]

                                    text-white

                                    shadow-sm
                                  `
                                  : `
                                    text-slate-600
                                    dark:text-slate-300
                                  `
                              }
                            "
                          >

                            <span
                              class="
                                text-sm

                                font-bold
                              "
                            >
                              ${day.getDate()}
                            </span>


                            <span
                              class="
                                text-[9px]

                                ${
                                  today
                                    ? 'text-white/70'
                                    : 'text-slate-400'
                                }
                              "
                            >
                              ${day.toLocaleDateString(
                                'en',
                                {
                                  weekday: 'short'
                                }
                              )}
                            </span>

                          </div>

                        </div>

                      `;

                    }
                  )
                  .join('')
                }

              </div>


              <!-- ================================= -->
              <!-- EQUIPMENT ROWS -->
              <!-- ================================= -->

              ${
                items.length === 0

                  ? `

                    <div
                      class="
                        p-16

                        text-center
                      "
                    >

                      <div
                        class="
                          w-16
                          h-16

                          mx-auto
                          mb-5

                          rounded-2xl

                          bg-slate-100
                          dark:bg-slate-800

                          flex
                          items-center
                          justify-center

                          text-3xl
                        "
                      >
                        🔬
                      </div>


                      <h3
                        class="
                          text-lg

                          font-bold
                        "
                      >
                        No equipment available
                      </h3>


                      <p
                        class="
                          text-sm

                          text-slate-400

                          mt-2
                        "
                      >
                        Equipment added to the catalog
                        will appear here.
                      </p>

                    </div>

                  `

                  : items
                      .map(
                        item => {

                          const itemBookings =
                            reservations.filter(
                              reservation =>
                                reservation.itemId ===
                                  item.id &&

                                reservation.status ===
                                  'active'
                            );


                          return `

                            <div
                              class="
                                grid

                                grid-cols-[250px_repeat(14,minmax(60px,1fr))]

                                border-b
                                border-slate-100
                                dark:border-slate-800

                                last:border-b-0

                                group
                              "
                            >

                              <!-- RESOURCE -->

                              <div
                                class="
                                  p-4

                                  flex
                                  items-center

                                  gap-3

                                  sticky
                                  left-0

                                  z-10

                                  bg-white
                                  dark:bg-slate-800

                                  border-r
                                  border-slate-100
                                  dark:border-slate-700
                                "
                              >

                                <div
                                  class="
                                    w-11
                                    h-11

                                    shrink-0

                                    rounded-2xl

                                    bg-gradient-to-br
                                    from-indigo-50
                                    to-purple-50

                                    dark:from-indigo-900/20
                                    dark:to-purple-900/20

                                    flex
                                    items-center
                                    justify-center

                                    text-xl

                                    shadow-sm
                                  "
                                >
                                  🔬
                                </div>


                                <div
                                  class="
                                    min-w-0
                                  "
                                >

                                  <p
                                    class="
                                      font-bold

                                      text-sm

                                      truncate
                                    "
                                  >
                                    ${this.escapeHtml(
                                      item.title
                                    )}
                                  </p>


                                  <p
                                    class="
                                      text-xs

                                      text-slate-400

                                      mt-1

                                      truncate
                                    "
                                  >
                                    📍
                                    ${this.escapeHtml(
                                      item.location ||
                                      'Library'
                                    )}
                                  </p>

                                </div>

                              </div>


                              <!-- DATE CELLS -->

                              ${days
                                .map(
                                  day => {

                                    const status =
                                      this.getDayStatus(
                                        day,
                                        itemBookings,
                                        user.id
                                      );


                                    const statusClasses = {

                                      available:
                                        `
                                          bg-emerald-50
                                          dark:bg-emerald-900/10

                                          hover:bg-emerald-200
                                          dark:hover:bg-emerald-800/30

                                          cursor-pointer
                                        `,

                                      mine:
                                        `
                                          bg-[#4648d4]

                                          shadow-inner
                                        `,

                                      others:
                                        `
                                          bg-slate-200
                                          dark:bg-slate-600
                                        `,

                                      overdue:
                                        `
                                          bg-rose-500

                                          shadow-inner
                                        `

                                    };


                                    return `

                                      <div

                                        class="
                                          relative

                                          min-h-[68px]

                                          border-l
                                          border-slate-100
                                          dark:border-slate-700

                                          p-1.5

                                          transition-all
                                          duration-150

                                          ${
                                            statusClasses[
                                              status
                                            ]
                                          }

                                          ${
                                            status ===
                                            'available'
                                              ? `
                                                hover:shadow-inner
                                              `
                                              : ''
                                          }
                                        "

                                        data-item-id="${item.id}"

                                        data-date="${day.toISOString()}"

                                        data-status="${status}"

                                        title="${
                                          status === 'available'
                                            ? 'Click to reserve'
                                            : status === 'mine'
                                              ? 'Your booking'
                                              : status === 'overdue'
                                                ? 'Overdue booking'
                                                : 'Booked'
                                        }"
                                      >

                                        ${
                                          status ===
                                          'available'

                                            ? `

                                              <div
                                                class="
                                                  w-full
                                                  h-full

                                                  min-h-[52px]

                                                  rounded-xl

                                                  flex
                                                  items-center
                                                  justify-center

                                                  opacity-0

                                                  hover:opacity-100

                                                  transition-opacity
                                                "
                                              >

                                                <span
                                                  class="
                                                    w-7
                                                    h-7

                                                    rounded-lg

                                                    bg-white

                                                    text-emerald-600

                                                    shadow-sm

                                                    flex
                                                    items-center
                                                    justify-center

                                                    font-bold
                                                  "
                                                >
                                                  +
                                                </span>

                                              </div>

                                            `

                                            : status ===
                                              'mine'

                                              ? `

                                                <div
                                                  class="
                                                    h-full

                                                    min-h-[52px]

                                                    flex
                                                    items-center
                                                    justify-center
                                                  "
                                                >

                                                  <span
                                                    class="
                                                      text-white

                                                      text-sm
                                                  "
                                                  >
                                                    ✓
                                                  </span>

                                                </div>

                                              `

                                              : status ===
                                                'overdue'

                                                ? `

                                                  <div
                                                    class="
                                                      h-full

                                                      min-h-[52px]

                                                      flex
                                                      items-center
                                                      justify-center
                                                    "
                                                  >
                                                    <span
                                                      class="
                                                        text-white
                                                        text-xs
                                                        font-bold
                                                      "
                                                    >
                                                      !
                                                    </span>
                                                  </div>

                                                `

                                                : ''

                                        }

                                      </div>

                                    `;

                                  }
                                )
                                .join('')
                              }

                            </div>

                          `;

                        }
                      )
                      .join('')
              }

            </div>

          </div>

        </section>


        <!-- ================================= -->
        <!-- HELP CARD -->
        <!-- ================================= -->

        <section
          class="
            rh-card

            p-5
            md:p-6

            flex
            flex-col
            md:flex-row

            md:items-center
            md:justify-between

            gap-4
          "
        >

          <div
            class="
              flex
              items-center

              gap-4
            "
          >

            <div
              class="
                w-11
                h-11

                shrink-0

                rounded-2xl

                bg-indigo-50
                dark:bg-indigo-900/20

                text-[#4648d4]
                dark:text-indigo-300

                flex
                items-center
                justify-center

                text-lg
              "
            >
              💡
            </div>


            <div>

              <p
                class="
                  font-bold

                  text-sm
                "
              >
                How to book
              </p>


              <p
                class="
                  text-xs

                  text-slate-400

                  mt-1
                "
              >
                Click any green available slot
                to start a reservation.
              </p>

            </div>

          </div>


          <div
            class="
              text-xs

              text-slate-400
            "
          >
            Showing the next 14 days
          </div>

        </section>

      </div>

    `;


    this.attachListeners(
      container,
      items,
      user
    );

  },


  // ==========================================
  // LEGEND ITEM
  // ==========================================

  legendItem(
    color,
    label
  ) {

    return `

      <div
        class="
          flex
          items-center

          gap-2
        "
      >

        <span
          class="
            w-3
            h-3

            rounded-md

            ${color}

            shadow-sm
          "
        ></span>


        <span
          class="
            text-xs

            font-medium

            text-slate-600
            dark:text-slate-300
          "
        >
          ${label}
        </span>

      </div>

    `;

  },


  // ==========================================
  // GENERATE DAYS
  // ==========================================

  generateDays(count) {

    const days = [];


    const today =
      new Date();


    today.setHours(
      0,
      0,
      0,
      0
    );


    for (
      let i = 0;
      i < count;
      i++
    ) {

      const date =
        new Date(today);


      date.setDate(
        today.getDate() + i
      );


      days.push(
        date
      );

    }


    return days;

  },


  // ==========================================
  // TODAY
  // ==========================================

  isToday(date) {

    return (
      date.toDateString()
      ===
      new Date().toDateString()
    );

  },


  // ==========================================
  // DAY STATUS
  // ==========================================

  getDayStatus(
    day,
    bookings,
    userId
  ) {

    for (
      const booking of bookings
    ) {

      const start =
        new Date(
          booking.startDate
        );


      const end =
        new Date(
          booking.endDate
        );


      start.setHours(
        0,
        0,
        0,
        0
      );


      end.setHours(
        23,
        59,
        59,
        999
      );


      if (
        day >= start &&
        day <= end
      ) {

        if (
          new Date() > end
        ) {

          return 'overdue';

        }


        return (
          booking.userId === userId
            ? 'mine'
            : 'others'
        );

      }

    }


    return 'available';

  },


  // ==========================================
  // LISTENERS
  // ==========================================

  attachListeners(
    container,
    items,
    user
  ) {

    container
      .querySelectorAll(
        '[data-status="available"]'
      )
      .forEach(
        cell => {

          cell.addEventListener(
            'click',
            () => {

              const item =
                items.find(
                  resource =>
                    resource.id ===
                    cell.dataset.itemId
                );


              if (!item) {

                return;

              }


              this.openBookingModal(
                item,

                new Date(
                  cell.dataset.date
                ),

                container,

                user
              );

            }
          );

        }
      );

  },


  // ==========================================
  // BOOKING MODAL
  // ==========================================

  openBookingModal(
    item,
    date,
    container,
    user
  ) {

    const end =
      new Date(date);


    end.setDate(
      date.getDate() + 2
    );


    const startValue =
      this.formatDateInput(
        date
      );


    const endValue =
      this.formatDateInput(
        end
      );


    Components.modal(`

      <div
        class="
          p-6
          md:p-7

          space-y-6
        "
      >

        <!-- HEADER -->

        <div>

          <div
            class="
              w-12
              h-12

              rounded-2xl

              bg-gradient-to-br
              from-indigo-50
              to-purple-50

              dark:from-indigo-900/20
              dark:to-purple-900/20

              flex
              items-center
              justify-center

              text-xl

              mb-4
            "
          >
            🔬
          </div>


          <p
            class="
              text-xs

              uppercase

              tracking-[0.14em]

              font-bold

              text-[#4648d4]
              dark:text-indigo-300
            "
          >
            Equipment Reservation
          </p>


          <h2
            class="
              text-2xl

              font-bold

              tracking-tight

              mt-1
            "
          >
            Reserve:
            ${this.escapeHtml(
              item.title
            )}
          </h2>


          <p
            class="
              text-sm

              text-slate-400

              mt-2
            "
          >
            Select the dates you need this equipment.
          </p>

        </div>


        <!-- DATES -->

        <div
          class="
            grid

            grid-cols-1
            sm:grid-cols-2

            gap-4
          "
        >

          <div>

            <label
              for="book-start"

              class="
                block

                text-xs

                uppercase

                tracking-wide

                font-bold

                text-slate-500
                dark:text-slate-400

                mb-2
              "
            >
              Start Date
            </label>


            <input

              type="date"

              id="book-start"

              value="${startValue}"

              class="
                rh-input
              "
            />

          </div>


          <div>

            <label
              for="book-end"

              class="
                block

                text-xs

                uppercase

                tracking-wide

                font-bold

                text-slate-500
                dark:text-slate-400

                mb-2
              "
            >
              End Date
            </label>


            <input

              type="date"

              id="book-end"

              value="${endValue}"

              class="
                rh-input
              "
            />

          </div>

        </div>


        <!-- DETAILS -->

        <div
          class="
            grid

            grid-cols-1
            sm:grid-cols-2

            gap-3
          "
        >

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
                text-[10px]

                uppercase

                tracking-wide

                font-bold

                text-slate-400
              "
            >
              Late Fee
            </p>


            <p
              class="
                text-lg

                font-bold

                mt-1
              "
            >
              ₹${Number(
                item.finePerDay || 3
              ).toFixed(2)}
              <span
                class="
                  text-xs

                  text-slate-400

                  font-normal
                "
              >
                /day
              </span>
            </p>

          </div>


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
                text-[10px]

                uppercase

                tracking-wide

                font-bold

                text-slate-400
              "
            >
              Location
            </p>


            <p
              class="
                text-sm

                font-bold

                mt-2

                truncate
              "
            >
              📍
              ${this.escapeHtml(
                item.location ||
                'Library'
              )}
            </p>

          </div>

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

            id="confirm-book"

            class="
              rh-btn

              !min-h-[46px]
            "
          >
            📅 Confirm Reservation
          </button>

        </div>

      </div>

    `);


    // ========================================
    // CONFIRM
    // ========================================

    const confirm =
      document.getElementById(
        'confirm-book'
      );


    if (!confirm) {

      return;

    }


    confirm.addEventListener(
      'click',
      async () => {

        const startDate =
          document.getElementById(
            'book-start'
          )?.value;


        const endDate =
          document.getElementById(
            'book-end'
          )?.value;


        if (
          !startDate ||
          !endDate
        ) {

          Components.showToast(
            'Please select both dates.',
            'warning'
          );

          return;

        }


        if (
          new Date(endDate) <
          new Date(startDate)
        ) {

          Components.showToast(
            'End date cannot be before start date.',
            'error'
          );

          return;

        }


        confirm.disabled =
          true;


        confirm.textContent =
          'Reserving...';


        try {

          await API.post(
            '/api/reservations',
            {
              itemId:
                item.id,

              startDate,

              endDate
            }
          );


          Components.showToast(
            'Equipment reserved!',
            'success'
          );


          window.closeModal();


          await this.render(
            container,
            user
          );

        }

        catch (error) {

          Components.showToast(
            error.message,
            'error'
          );


          confirm.disabled =
            false;


          confirm.textContent =
            '📅 Confirm Reservation';

        }

      }
    );

  },


  // ==========================================
  // DATE INPUT FORMAT
  // ==========================================

  formatDateInput(date) {

    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );


    return `${year}-${month}-${day}`;

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