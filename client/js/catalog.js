// ============================================
// CATALOG.JS - Browse, search, filter, borrow
// ============================================
// Stitch-inspired Tactile UI
//
// Functionality preserved:
// - Search
// - Type filter
// - Category filter
// - Book borrowing
// - Equipment availability
// - Waitlist
// - API integration
// ============================================

import { Components } from './components.js';
import { API } from './api.js';


export const Catalog = {

  // ==========================================
  // STATE
  // ==========================================

  allItems: [],

  filters: {
    type: '',
    category: '',
    q: ''
  },


  // ==========================================
  // RENDER
  // ==========================================

  async render(container, user) {

    this.allItems =
      await API.get('/api/items');


    // Reset filters when entering catalog

    this.filters = {
      type: '',
      category: '',
      q: ''
    };


    const categories = [
      ...new Set(
        this.allItems
          .map(item => item.category)
          .filter(Boolean)
      )
    ].sort();


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
              -top-28

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
              right-16
              -bottom-24

              w-52
              h-52

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

                    flex
                    items-center
                    justify-center

                    text-xl

                    backdrop-blur-sm
                  "
                >
                  📚
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
                  Resource Library
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
                Browse Catalog
              </h1>


              <p
                class="
                  mt-2

                  text-sm
                  md:text-base

                  text-white/70
                "
              >
                Discover books, equipment and
                other resources available to you.
              </p>

            </div>


            <!-- ITEM COUNT -->

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
                Total Resources
              </p>


              <p
                class="
                  text-3xl

                  font-bold

                  mt-1
                "
              >
                ${this.allItems.length}
              </p>

            </div>

          </div>

        </section>


        <!-- ================================= -->
        <!-- SEARCH + FILTERS -->
        <!-- ================================= -->

        <section
          class="
            rh-card

            p-5
            md:p-6
          "
        >

          <div
            class="
              flex
              flex-col
              lg:flex-row

              gap-4
            "
          >

            <!-- SEARCH -->

            <div
              class="
                relative

                flex-1
              "
            >

              <span
                class="
                  absolute

                  left-4
                  top-1/2

                  -translate-y-1/2

                  text-lg

                  text-slate-400

                  pointer-events-none
                "
              >
                🔍
              </span>


              <input

                id="catalog-search"

                type="text"

                placeholder="Search by title, author, category..."

                autocomplete="off"

                class="
                  rh-input

                  !pl-11
                "
              />


              <kbd
                class="
                  hidden
                  sm:block

                  absolute

                  right-3
                  top-1/2

                  -translate-y-1/2

                  px-2
                  py-1

                  rounded-lg

                  bg-white

                  dark:bg-slate-800

                  border
                  border-slate-200
                  dark:border-slate-700

                  text-[10px]

                  font-semibold

                  text-slate-400
                "
              >
                Ctrl K
              </kbd>

            </div>


            <!-- TYPE -->

            <div
              class="
                relative
              "
            >

              <select

                id="filter-type"

                class="
                  rh-input

                  appearance-none

                  cursor-pointer

                  min-w-[170px]

                  !pr-10
                "
              >

                <option value="">
                  All Types
                </option>

                <option value="book">
                  📚 Books
                </option>

                <option value="equipment">
                  🔬 Equipment
                </option>

              </select>


              <span
                class="
                  absolute

                  right-4
                  top-1/2

                  -translate-y-1/2

                  text-slate-400

                  pointer-events-none
                "
              >
                ▾
              </span>

            </div>


            <!-- CATEGORY -->

            <div
              class="
                relative
              "
            >

              <select

                id="filter-category"

                class="
                  rh-input

                  appearance-none

                  cursor-pointer

                  min-w-[190px]

                  !pr-10
                "
              >

                <option value="">
                  All Categories
                </option>

                ${categories
                  .map(
                    category => `
                      <option value="${this.escapeHtml(category)}">
                        ${this.escapeHtml(category)}
                      </option>
                    `
                  )
                  .join('')
                }

              </select>


              <span
                class="
                  absolute

                  right-4
                  top-1/2

                  -translate-y-1/2

                  text-slate-400

                  pointer-events-none
                "
              >
                ▾
              </span>

            </div>

          </div>


          <!-- FILTER SUMMARY -->

          <div
            class="
              flex
              items-center
              justify-between

              gap-4

              mt-5

              pt-4

              border-t
              border-slate-100
              dark:border-slate-700
            "
          >

            <div
              class="
                flex
                items-center

                gap-2
              "
            >

              <span
                class="
                  w-2
                  h-2

                  rounded-full

                  bg-emerald-500
                "
              ></span>


              <span
                id="catalog-result-count"

                class="
                  text-xs

                  text-slate-500
                  dark:text-slate-400
                "
              >
                ${this.allItems.length} resources
              </span>

            </div>


            <button

              id="clear-catalog-filters"

              class="
                hidden

                text-xs

                font-semibold

                text-[#4648d4]

                hover:underline
              "
            >
              Clear filters
            </button>

          </div>

        </section>


        <!-- ================================= -->
        <!-- CATALOG GRID -->
        <!-- ================================= -->

        <section>

          <div
            id="catalog-grid"

            class="
              grid

              grid-cols-1
              sm:grid-cols-2
              xl:grid-cols-3

              gap-5
            "
          ></div>

        </section>

      </div>

    `;


    this.attachListeners(
      container,
      user
    );


    this.renderGrid(
      container,
      user
    );

  },


  // ==========================================
  // LISTENERS
  // ==========================================

  attachListeners(
    container,
    user
  ) {

    const search =
      container.querySelector(
        '#catalog-search'
      );


    const type =
      container.querySelector(
        '#filter-type'
      );


    const category =
      container.querySelector(
        '#filter-category'
      );


    const clear =
      container.querySelector(
        '#clear-catalog-filters'
      );


    // SEARCH

    search.addEventListener(
      'input',
      event => {

        this.filters.q =
          event.target.value;

        this.renderGrid(
          container,
          user
        );

      }
    );


    // TYPE

    type.addEventListener(
      'change',
      event => {

        this.filters.type =
          event.target.value;

        this.renderGrid(
          container,
          user
        );

      }
    );


    // CATEGORY

    category.addEventListener(
      'change',
      event => {

        this.filters.category =
          event.target.value;

        this.renderGrid(
          container,
          user
        );

      }
    );


    // CLEAR

    clear.addEventListener(
      'click',
      () => {

        this.filters = {
          type: '',
          category: '',
          q: ''
        };


        search.value = '';

        type.value = '';

        category.value = '';


        this.renderGrid(
          container,
          user
        );

      }
    );


    // ========================================
    // CTRL + K SEARCH
    // ========================================

    document.addEventListener(
      'keydown',
      this.handleKeyboardShortcut
    );

  },


  handleKeyboardShortcut(event) {

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === 'k'
    ) {

      const search =
        document.getElementById(
          'catalog-search'
        );


      if (search) {

        event.preventDefault();

        search.focus();

      }

    }

  },


  // ==========================================
  // RENDER GRID
  // ==========================================

  renderGrid(
    container,
    user
  ) {

    const {
      type,
      category,
      q
    } = this.filters;


    const query =
      q.trim().toLowerCase();


    const filtered =
      this.allItems.filter(
        item => {

          const title =
            String(
              item.title || ''
            ).toLowerCase();


          const author =
            String(
              item.author || ''
            ).toLowerCase();


          const itemCategory =
            String(
              item.category || ''
            ).toLowerCase();


          return (

            (!type ||
              item.type === type)

            &&

            (!category ||
              item.category === category)

            &&

            (
              !query ||

              title.includes(query) ||

              author.includes(query) ||

              itemCategory.includes(query)
            )

          );

        }
      );


    const grid =
      container.querySelector(
        '#catalog-grid'
      );


    const count =
      container.querySelector(
        '#catalog-result-count'
      );


    const clear =
      container.querySelector(
        '#clear-catalog-filters'
      );


    // UPDATE COUNT

    if (count) {

      count.textContent =
        `${filtered.length} ${
          filtered.length === 1
            ? 'resource'
            : 'resources'
        }`;

    }


    // SHOW CLEAR BUTTON

    if (clear) {

      const hasFilters =
        Boolean(
          type ||
          category ||
          q
        );


      clear.classList.toggle(
        'hidden',
        !hasFilters
      );

    }


    // EMPTY STATE

    if (filtered.length === 0) {

      grid.innerHTML = `

        <div
          class="
            col-span-full

            rh-card

            py-16
            px-6

            text-center
          "
        >

          <div
            class="
              w-16
              h-16

              mx-auto

              rounded-2xl

              bg-slate-100
              dark:bg-slate-800

              flex
              items-center
              justify-center

              text-3xl

              mb-5
            "
          >
            🔍
          </div>


          <h3
            class="
              text-lg

              font-bold
            "
          >
            No resources found
          </h3>


          <p
            class="
              text-sm

              text-slate-400

              mt-2
            "
          >
            Try changing your search or filters.
          </p>


          <button

            id="empty-clear-filters"

            class="
              rh-btn

              !mt-5
            "
          >
            Clear Filters
          </button>

        </div>

      `;


      const emptyClear =
        document.getElementById(
          'empty-clear-filters'
        );


      if (emptyClear) {

        emptyClear.addEventListener(
          'click',
          () => {

            this.filters = {
              type: '',
              category: '',
              q: ''
            };


            container.querySelector(
              '#catalog-search'
            ).value = '';


            container.querySelector(
              '#filter-type'
            ).value = '';


            container.querySelector(
              '#filter-category'
            ).value = '';


            this.renderGrid(
              container,
              user
            );

          }
        );

      }


      return;

    }


    // ========================================
    // RENDER CARDS
    // ========================================

    grid.innerHTML =
      filtered
        .map(
          item =>
            this.itemCard(item)
        )
        .join('');


    // BORROW

    grid
      .querySelectorAll(
        '[data-borrow]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            () =>
              this.borrowBook(
                button.dataset.borrow,
                container,
                user
              )
          );

        }
      );


    // WAITLIST

    grid
      .querySelectorAll(
        '[data-waitlist]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            () =>
              this.joinWaitlist(
                button.dataset.waitlist,
                container,
                user
              )
          );

        }
      );

  },


  // ==========================================
  // ITEM CARD
  // ==========================================

  itemCard(item) {

    const isAvailable =
      item.status === 'available';


    const isMaintenance =
      item.status === 'maintenance';


    const status =

      isAvailable

        ? {
            text: 'Available',

            classes:
              'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',

            dot:
              'bg-emerald-500'
          }

        : isMaintenance

          ? {
              text: 'Maintenance',

              classes:
                'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',

              dot:
                'bg-amber-500'
            }

          : {
              text:
                item.status || 'Unavailable',

              classes:
                'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',

              dot:
                'bg-rose-500'
            };


    const typeIcon =
      item.type === 'book'
        ? '📚'
        : '🔬';


    // ========================================
    // ACTION
    // ========================================

    let actionButton = '';


    if (item.type === 'book') {

      actionButton =

        isAvailable

          ? `

            <button

              data-borrow="${item.id}"

              class="
                rh-btn

                w-full

                !min-h-[44px]

                text-sm
              "
            >
              <span>📖</span>
              Borrow Now
            </button>

          `

          : `

            <button

              data-waitlist="${item.id}"

              class="
                rh-btn

                w-full

                !min-h-[44px]

                !from-amber-500
                !to-orange-500

                !border-amber-200

                text-sm
              "
            >
              <span>⏳</span>
              Join Waitlist
            </button>

          `;

    }

    else {

      actionButton = `

        <a

          href="/timeline"

          data-route="/timeline"

          class="
            rh-btn

            w-full

            !min-h-[44px]

            text-sm
          "
        >
          <span>📅</span>
          View Availability
        </a>

      `;

    }


    // ========================================
    // COVER
    // ========================================

    const cover =

      item.coverUrl

        ? `

          <img

            src="${this.escapeHtml(item.coverUrl)}"

            class="
              h-full
              w-full

              object-cover

              transition-transform
              duration-500

              group-hover:scale-105
            "

            alt="${this.escapeHtml(
              item.title
            )}"
          />

        `

        : `

          <div
            class="
              text-5xl

              transition-transform
              duration-300

              group-hover:scale-110
            "
          >
            ${typeIcon}
          </div>

        `;


    return `

      <article

        class="
          rh-card

          group

          overflow-hidden

          flex
          flex-col

          h-full
        "
      >

        <!-- ================================= -->
        <!-- IMAGE -->
        <!-- ================================= -->

        <div
          class="
            relative

            h-44

            overflow-hidden

            bg-gradient-to-br
            from-indigo-50
            to-purple-50

            dark:from-slate-800
            dark:to-slate-700

            flex
            items-center
            justify-center
          "
        >

          ${cover}


          <!-- IMAGE OVERLAY -->

          <div
            class="
              absolute
              inset-0

              bg-gradient-to-t
              from-black/20
              to-transparent

              opacity-0

              group-hover:opacity-100

              transition-opacity
            "
          ></div>


          <!-- TYPE -->

          <span
            class="
              absolute

              top-3
              left-3

              px-2.5
              py-1

              rounded-full

              bg-white/85
              dark:bg-slate-900/80

              backdrop-blur-md

              text-[10px]

              uppercase

              tracking-wide

              font-bold

              text-slate-600
              dark:text-slate-200
            "
          >
            ${
              item.type === 'book'
                ? '📚 Book'
                : '🔬 Equipment'
            }
          </span>


          <!-- STATUS -->

          <span
            class="
              absolute

              top-3
              right-3

              px-2.5
              py-1

              rounded-full

              ${status.classes}

              text-[10px]

              uppercase

              tracking-wide

              font-bold

              flex
              items-center

              gap-1.5
            "
          >

            <span
              class="
                w-1.5
                h-1.5

                rounded-full

                ${status.dot}
              "
            ></span>

            ${this.escapeHtml(
              status.text
            )}

          </span>

        </div>


        <!-- ================================= -->
        <!-- CONTENT -->
        <!-- ================================= -->

        <div
          class="
            p-5

            flex-1

            flex
            flex-col
          "
        >

          <!-- TITLE -->

          <div>

            <h3
              class="
                text-base

                font-bold

                leading-snug

                line-clamp-2
              "
            >
              ${this.escapeHtml(
                item.title
              )}
            </h3>


            <p
              class="
                text-sm

                text-slate-500
                dark:text-slate-400

                mt-2

                line-clamp-1
              "
            >
              ${
                item.author
                  ? `${this.escapeHtml(item.author)} · `
                  : ''
              }

              ${this.escapeHtml(
                item.category || 'Uncategorized'
              )}
            </p>

          </div>


          <!-- META -->

          <div
            class="
              mt-5

              space-y-2
            "
          >

            <div
              class="
                flex
                items-center

                gap-2

                text-xs

                text-slate-400
              "
            >

              <span
                class="
                  w-7
                  h-7

                  rounded-lg

                  bg-slate-100
                  dark:bg-slate-800

                  flex
                  items-center
                  justify-center
                "
              >
                📍
              </span>


              <span
                class="truncate"
              >
                ${this.escapeHtml(
                  item.location || 'Location unavailable'
                )}
              </span>

            </div>


            <div
              class="
                flex
                items-center

                gap-2

                text-xs

                text-slate-400
              "
            >

              <span
                class="
                  w-7
                  h-7

                  rounded-lg

                  bg-slate-100
                  dark:bg-slate-800

                  flex
                  items-center
                  justify-center
                "
              >
                💰
              </span>


              <span>
                $${Number(
                  item.finePerDay || 0
                ).toFixed(2)}/day late fee
              </span>

            </div>

          </div>


          <!-- ACTION -->

          <div
            class="
              mt-auto

              pt-5
            "
          >

            ${actionButton}

          </div>

        </div>

      </article>

    `;

  },


  // ==========================================
  // BORROW BOOK
  // ==========================================

  async borrowBook(
    itemId,
    container,
    user
  ) {

    try {

      await API.post(
        '/api/reservations',
        {
          itemId
        }
      );


      Components.showToast(
        'Book borrowed! Due in 14 days.',
        'success'
      );


      this.allItems =
        await API.get(
          '/api/items'
        );


      this.renderGrid(
        container,
        user
      );

    }

    catch (error) {

      Components.showToast(
        error.message,
        'error'
      );

    }

  },


  // ==========================================
  // JOIN WAITLIST
  // ==========================================

  async joinWaitlist(
    itemId,
    container,
    user
  ) {

    try {

      await API.post(
        '/api/waitlist',
        {
          itemId,
          urgency: 'normal'
        }
      );


      Components.showToast(
        'Added to waitlist',
        'success'
      );

    }

    catch (error) {

      Components.showToast(
        error.message,
        'error'
      );

    }

  },


  // ==========================================
  // ESCAPE HTML
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