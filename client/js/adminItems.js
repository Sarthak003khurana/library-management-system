// ============================================
// ADMIN ITEMS.JS
// CRUD + ISBN autofill + bulk CSV import
// + EDIT + QUANTITY MANAGEMENT
// ============================================
//
// Covers:
// - Add items
// - Edit items
// - Delete items
// - ISBN autofill
// - Bulk CSV import
// - Quantity management
// - Forms / validation
// - FileReader
// - Fetch / async-await
//
// QUANTITY SYSTEM:
//
// quantity = total physical copies
// availableQuantity = currently available copies
//
// Example:
//
// quantity: 10
// availableQuantity: 9
//
// Means:
//
// 9 / 10 copies available
//
// ============================================

import { Components } from './components.js';
import { API } from './api.js';

export const AdminItems = {

  // ==========================================
  // RENDER
  // ==========================================

  async render(container) {

    const items =
      await API.get('/api/items');


    container.innerHTML = `

      <div class="space-y-6 fade-in">

        <!-- ================================= -->
        <!-- HEADER -->
        <!-- ================================= -->

        <div
          class="
            flex
            items-center
            justify-between
            flex-wrap
            gap-4
          "
        >

          <div>

            <h1 class="text-3xl font-bold">
              Manage Items
            </h1>

            <p class="text-sm text-slate-500 mt-1">
              Add, edit and manage library resources.
            </p>

          </div>


          <div class="flex gap-3 flex-wrap">

            <!-- BULK IMPORT -->

            <label
              class="
                px-4
                py-2
                rounded-lg
                border
                border-slate-300
                dark:border-slate-600
                cursor-pointer
                hover:bg-slate-100
                dark:hover:bg-slate-700
                text-sm
                font-medium
              "
            >

              Bulk Import CSV

              <input
                type="file"
                id="csv-input"
                accept=".csv"
                class="hidden"
              >

            </label>


            <!-- ADD ITEM -->

            <button
              id="add-item-btn"
              class="
                px-4
                py-2
                bg-primary-600
                text-white
                rounded-lg
                hover:bg-primary-700
                text-sm
                font-medium
              "
            >
              + Add Item
            </button>

          </div>

        </div>


        <!-- ================================= -->
        <!-- TABLE -->
        <!-- ================================= -->

        <div
          class="
            bg-white
            dark:bg-slate-800
            rounded-xl
            shadow-sm
            border
            border-slate-200
            dark:border-slate-700
            overflow-x-auto
          "
        >

          <table class="w-full text-sm">

            <thead>

              <tr
                class="
                  border-b
                  border-slate-200
                  dark:border-slate-700
                  text-left
                  text-slate-500
                "
              >

                <th class="p-4">
                  Title
                </th>

                <th class="p-4">
                  Type
                </th>

                <th class="p-4">
                  Category
                </th>

                <th class="p-4">
                  Availability
                </th>

                <th class="p-4">
                  Status
                </th>

                <th class="p-4">
                  Fine/day
                </th>

                <th class="p-4">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody
              id="items-tbody"
              class="
                divide-y
                divide-slate-100
                dark:divide-slate-700
              "
            >

              ${
                items.length === 0

                  ? `
                    <tr>

                      <td
                        colspan="7"
                        class="
                          p-10
                          text-center
                          text-slate-500
                        "
                      >
                        No items found.
                      </td>

                    </tr>
                  `

                  : items
                      .map(
                        item =>
                          this.row(item)
                      )
                      .join('')
              }

            </tbody>

          </table>

        </div>

      </div>

    `;


    this.attachListeners(
      container
    );

  },


  // ==========================================
  // TABLE ROW
  // ==========================================

  row(item) {

    const statusColor =
      item.status === 'available'

        ? 'bg-emerald-100 text-emerald-700'

        : item.status === 'maintenance'

          ? 'bg-amber-100 text-amber-700'

          : 'bg-rose-100 text-rose-700';


    const totalQuantity =
      Number(
        item.quantity ?? 1
      );


    const availableQuantity =
      Math.min(
        totalQuantity,
        Number(
          item.availableQuantity ??
          totalQuantity
        )
      );


    const borrowedQuantity =
      Math.max(
        0,
        totalQuantity -
        availableQuantity
      );


    let availabilityClass =
      'bg-emerald-100 text-emerald-700';


    if (
      availableQuantity === 0
    ) {

      availabilityClass =
        'bg-rose-100 text-rose-700';

    }

    else if (
      availableQuantity <
      totalQuantity
    ) {

      availabilityClass =
        'bg-amber-100 text-amber-700';

    }


    return `

      <tr
        data-row="${this.escapeHtml(item.id)}"
        class="
          hover:bg-slate-50
          dark:hover:bg-slate-700/40
          transition-colors
        "
      >

        <!-- TITLE -->

        <td
          class="
            p-4
            font-medium
          "
        >

          ${this.escapeHtml(
            item.title
          )}

          ${
            borrowedQuantity > 0
              ? `
                <p class="text-xs text-slate-400 mt-1">
                  ${borrowedQuantity} currently borrowed
                </p>
              `
              : ''
          }

        </td>


        <!-- TYPE -->

        <td
          class="
            p-4
            capitalize
          "
        >

          ${this.escapeHtml(
            item.type
          )}

        </td>


        <!-- CATEGORY -->

        <td class="p-4">

          ${this.escapeHtml(
            item.category
          )}

        </td>


        <!-- AVAILABILITY -->

        <td class="p-4">

          <span
            class="
              inline-flex
              items-center
              px-3
              py-1
              rounded-full
              text-xs
              font-bold
              ${availabilityClass}
            "
          >

            ${availableQuantity} / ${totalQuantity}

          </span>

          <p class="text-xs text-slate-400 mt-1">
            ${availableQuantity === 0
              ? 'No copies available'
              : `${availableQuantity} available`}
          </p>

        </td>


        <!-- STATUS -->

        <td class="p-4">

          <span
            class="
              px-2
              py-0.5
              rounded-full
              text-xs
              font-medium
              ${statusColor}
            "
          >

            ${this.escapeHtml(
              item.status || 'unknown'
            )}

          </span>

        </td>


        <!-- FINE -->

        <td class="p-4">

          ₹${Number(
            item.finePerDay ?? 3
          ).toFixed(2)}

        </td>


        <!-- ACTIONS -->

        <td class="p-4">

          <div
            class="
              flex
              items-center
              gap-3
            "
          >

            <!-- EDIT -->

            <button
              data-edit="${this.escapeHtml(item.id)}"
              class="
                text-primary-600
                hover:text-primary-800
                text-xs
                font-semibold
              "
            >
              Edit
            </button>


            <!-- DELETE -->

            <button
              data-delete="${this.escapeHtml(item.id)}"
              class="
                text-rose-500
                hover:text-rose-700
                text-xs
                font-medium
              "
            >
              Delete
            </button>

          </div>

        </td>

      </tr>

    `;

  },


  // ==========================================
  // LISTENERS
  // ==========================================

  attachListeners(container) {

    // ----------------------------------------
    // ADD
    // ----------------------------------------

    container
      .querySelector(
        '#add-item-btn'
      )
      .addEventListener(
        'click',
        () =>
          this.openAddModal(
            container
          )
      );


    // ----------------------------------------
    // CSV
    // ----------------------------------------

    container
      .querySelector(
        '#csv-input'
      )
      .addEventListener(
        'change',
        event =>
          this.handleCsvImport(
            event,
            container
          )
      );


    // ========================================
    // EDIT BUTTONS
    // ========================================

    container
      .querySelectorAll(
        '[data-edit]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            async () => {

              const itemId =
                button.dataset.edit;


              try {

                const item =
                  await API.get(
                    `/api/items/${itemId}`
                  );


                this.openEditModal(
                  item,
                  container
                );

              }

              catch (err) {

                Components.showToast(
                  err.message,
                  'error'
                );

              }

            }
          );

        }
      );


    // ========================================
    // DELETE BUTTONS
    // ========================================

    container
      .querySelectorAll(
        '[data-delete]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            async () => {

              const itemId =
                button.dataset.delete;


              const confirmed =
                confirm(
                  'Delete this item?'
                );


              if (!confirmed) {

                return;

              }


              try {

                await API.delete(
                  `/api/items/${itemId}`
                );


                button
                  .closest('tr')
                  ?.remove();


                Components.showToast(
                  'Item deleted',
                  'success'
                );

              }

              catch (err) {

                Components.showToast(
                  err.message,
                  'error'
                );

              }

            }
          );

        }
      );

  },


  // ==========================================
  // ADD MODAL
  // ==========================================

  openAddModal(container) {

    Components.modal(`

      <div class="p-6 space-y-5">

        <!-- HEADER -->

        <div>

          <h2 class="text-2xl font-bold">
            Add Resource
          </h2>

          <p class="text-sm text-slate-500 mt-1">
            Add a new book or equipment item.
          </p>

        </div>


        <!-- ISBN -->

        <div>

          <div class="flex gap-2">

            <input
              type="text"
              id="isbn-input"
              placeholder="Enter ISBN to autofill (books only)"
              class="
                flex-1
                px-4
                py-2
                rounded-lg
                border
                border-slate-300
                dark:border-slate-600
                dark:bg-slate-800
              "
            >


            <button
              id="isbn-lookup-btn"
              class="
                px-4
                py-2
                bg-slate-800
                dark:bg-slate-600
                text-white
                rounded-lg
                text-sm
              "
            >
              Autofill
            </button>

          </div>


          <p
            id="isbn-status"
            class="
              text-xs
              text-slate-500
              mt-1
            "
          ></p>

        </div>


        <!-- FORM -->

        <div
          class="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-4
          "
        >

          ${this.formField(
            'f-title',
            'Title',
            'text',
            ''
          )}


          <!-- TYPE -->

          <div>

            <label
              class="
                block
                text-sm
                font-medium
                mb-1
              "
            >
              Type
            </label>


            <select
              id="f-type"
              class="
                w-full
                px-4
                py-2
                rounded-lg
                border
                border-slate-300
                dark:border-slate-600
                dark:bg-slate-800
              "
            >

              <option value="book">
                Book
              </option>

              <option value="equipment">
                Equipment
              </option>

            </select>

          </div>


          ${this.formField(
            'f-category',
            'Category',
            'text',
            ''
          )}


          ${this.formField(
            'f-location',
            'Location',
            'text',
            'Main Library'
          )}


          ${this.formField(
            'f-author',
            'Author (books)',
            'text',
            ''
          )}


          <!-- QUANTITY -->

          ${this.formField(
            'f-quantity',
            'Total Quantity',
            'number',
            '1',
            'min="1"'
          )}


          ${this.formField(
            'f-fine',
            'Fine per day (₹)',
            'number',
            '3',
            'min="0" step="0.01"'
          )}

        </div>


        <!-- QUANTITY INFO -->

        <div
          class="
            bg-primary-50
            dark:bg-primary-900/20
            border
            border-primary-100
            dark:border-primary-800
            rounded-lg
            p-4
            text-sm
          "
        >

          <p class="font-semibold text-primary-700 dark:text-primary-300">
            Quantity
          </p>

          <p class="text-slate-600 dark:text-slate-300 mt-1">
            If you add 10 copies, the system will automatically
            start with 10 available copies.
          </p>

        </div>


        <!-- ACTIONS -->

        <div
          class="
            flex
            justify-end
            gap-3
          "
        >

          <button
            onclick="closeModal()"
            class="
              px-4
              py-2
              rounded-lg
              border
              hover:bg-slate-100
              dark:hover:bg-slate-700
            "
          >
            Cancel
          </button>


          <button
            id="save-item-btn"
            class="
              px-4
              py-2
              bg-primary-600
              text-white
              rounded-lg
              hover:bg-primary-700
            "
          >
            Save Item
          </button>

        </div>

      </div>

    `);


    this.attachIsbnLookup();


    document
      .getElementById(
        'save-item-btn'
      )
      .addEventListener(
        'click',
        async () => {

          const payload =
            this.getFormPayload();


          // ------------------------------------
          // VALIDATION
          // ------------------------------------

          if (
            !payload.title ||
            !payload.category
          ) {

            Components.showToast(
              'Title and category are required',
              'error'
            );

            return;

          }


          if (
            !Number.isFinite(
              payload.quantity
            ) ||
            payload.quantity < 1
          ) {

            Components.showToast(
              'Quantity must be at least 1',
              'error'
            );

            return;

          }


          if (
            !Number.isFinite(
              payload.finePerDay
            ) ||
            payload.finePerDay < 0
          ) {

            Components.showToast(
              'Fine per day must be a valid number',
              'error'
            );

            return;

          }


          try {

            await API.post(
              '/api/items',
              payload
            );


            Components.showToast(
              `Item added with ${payload.quantity} ${payload.quantity === 1 ? 'copy' : 'copies'}`,
              'success'
            );


            window.closeModal();


            await this.render(
              container
            );

          }

          catch (err) {

            Components.showToast(
              err.message,
              'error'
            );

          }

        }
      );

  },


  // ==========================================
  // EDIT MODAL
  // ==========================================

  openEditModal(
    item,
    container
  ) {

    const totalQuantity =
      Number(
        item.quantity ?? 1
      );


    const availableQuantity =
      Math.min(
        totalQuantity,
        Number(
          item.availableQuantity ??
          totalQuantity
        )
      );


    const borrowedQuantity =
      Math.max(
        0,
        totalQuantity -
        availableQuantity
      );


    Components.modal(`

      <div class="p-6 space-y-5">

        <!-- HEADER -->

        <div>

          <div
            class="
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <div>

              <p
                class="
                  text-xs
                  uppercase
                  tracking-wider
                  font-semibold
                  text-primary-600
                "
              >
                Manage Resource
              </p>


              <h2
                class="
                  text-2xl
                  font-bold
                  mt-1
                "
              >
                Edit Item
              </h2>

            </div>


            <span
              class="
                px-3
                py-1
                rounded-full
                bg-slate-100
                dark:bg-slate-700
                text-xs
                text-slate-500
              "
            >
              ${this.escapeHtml(
                item.type
              )}
            </span>

          </div>


          <p
            class="
              text-sm
              text-slate-500
              mt-2
            "
          >
            Update any details for this resource.
          </p>

        </div>


        <!-- CURRENT QUANTITY -->

        <div
          class="
            grid
            grid-cols-1
            sm:grid-cols-3
            gap-3
          "
        >

          <div
            class="
              rounded-lg
              bg-slate-50
              dark:bg-slate-700/50
              p-4
            "
          >

            <p class="text-xs text-slate-500">
              Total Copies
            </p>

            <p class="text-xl font-bold mt-1">
              ${totalQuantity}
            </p>

          </div>


          <div
            class="
              rounded-lg
              bg-emerald-50
              dark:bg-emerald-900/20
              p-4
            "
          >

            <p class="text-xs text-slate-500">
              Available
            </p>

            <p class="text-xl font-bold text-emerald-600 mt-1">
              ${availableQuantity}
            </p>

          </div>


          <div
            class="
              rounded-lg
              bg-amber-50
              dark:bg-amber-900/20
              p-4
            "
          >

            <p class="text-xs text-slate-500">
              Borrowed
            </p>

            <p class="text-xl font-bold text-amber-600 mt-1">
              ${borrowedQuantity}
            </p>

          </div>

        </div>


        <!-- FORM -->

        <div
          class="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-4
          "
        >

          ${this.formField(
            'edit-title',
            'Title',
            'text',
            item.title
          )}


          <!-- TYPE -->

          <div>

            <label
              class="
                block
                text-sm
                font-medium
                mb-1
              "
            >
              Type
            </label>


            <select
              id="edit-type"
              class="
                w-full
                px-4
                py-2
                rounded-lg
                border
                border-slate-300
                dark:border-slate-600
                dark:bg-slate-800
              "
            >

              <option
                value="book"
                ${
                  item.type === 'book'
                    ? 'selected'
                    : ''
                }
              >
                Book
              </option>

              <option
                value="equipment"
                ${
                  item.type === 'equipment'
                    ? 'selected'
                    : ''
                }
              >
                Equipment
              </option>

            </select>

          </div>


          ${this.formField(
            'edit-category',
            'Category',
            'text',
            item.category
          )}


          ${this.formField(
            'edit-location',
            'Location',
            'text',
            item.location
          )}


          ${this.formField(
            'edit-author',
            'Author',
            'text',
            item.author
          )}


          <!-- TOTAL QUANTITY -->

          ${this.formField(
            'edit-quantity',
            'Total Quantity',
            'number',
            totalQuantity,
            'min="1"'
          )}


          ${this.formField(
            'edit-fine',
            'Fine per day (₹)',
            'number',
            item.finePerDay ?? 3,
            'min="0" step="0.01"'
          )}


          ${this.formField(
            'edit-cover',
            'Cover URL',
            'url',
            item.coverUrl
          )}


          <!-- STATUS -->

          <div>

            <label
              class="
                block
                text-sm
                font-medium
                mb-1
              "
            >
              Status
            </label>


            <select
              id="edit-status"
              class="
                w-full
                px-4
                py-2
                rounded-lg
                border
                border-slate-300
                dark:border-slate-600
                dark:bg-slate-800
              "
            >

              <option
                value="available"
                ${
                  item.status === 'available'
                    ? 'selected'
                    : ''
                }
              >
                Available
              </option>


              <option
                value="maintenance"
                ${
                  item.status === 'maintenance'
                    ? 'selected'
                    : ''
                }
              >
                Maintenance
              </option>

            </select>

          </div>

        </div>


        <!-- QUANTITY WARNING -->

        <div
          id="quantity-warning"
          class="
            hidden
            rounded-lg
            bg-amber-50
            dark:bg-amber-900/20
            border
            border-amber-200
            dark:border-amber-800
            p-4
            text-sm
            text-amber-700
            dark:text-amber-300
          "
        ></div>


        <!-- ISBN -->

        <div>

          <label
            class="
              block
              text-sm
              font-medium
              mb-1
            "
          >
            ISBN
          </label>


          <input
            type="text"
            id="edit-isbn"
            value="${this.escapeHtml(
              item.isbn || ''
            )}"
            class="
              w-full
              px-4
              py-2
              rounded-lg
              border
              border-slate-300
              dark:border-slate-600
              dark:bg-slate-800
            "
          >

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
              px-4
              py-2
              rounded-lg
              border
              hover:bg-slate-100
              dark:hover:bg-slate-700
            "
          >
            Cancel
          </button>


          <button
            id="update-item-btn"
            class="
              px-4
              py-2
              bg-primary-600
              text-white
              rounded-lg
              hover:bg-primary-700
            "
          >
            Save Changes
          </button>

        </div>

      </div>

    `);


    // ========================================
    // QUANTITY WARNING
    // ========================================

    const quantityInput =
      document.getElementById(
        'edit-quantity'
      );


    const quantityWarning =
      document.getElementById(
        'quantity-warning'
      );


    const updateQuantityWarning =
      () => {

        const newQuantity =
          Number(
            quantityInput.value
          );


        if (
          !Number.isFinite(
            newQuantity
          ) ||
          newQuantity < 1
        ) {

          quantityWarning.classList
            .remove('hidden');

          quantityWarning.textContent =
            'Total quantity must be at least 1.';

          return;

        }


        if (
          newQuantity <
          borrowedQuantity
        ) {

          quantityWarning.classList
            .remove('hidden');

          quantityWarning.textContent =
            `You currently have ${borrowedQuantity} borrowed copy/copies. Total quantity cannot be reduced below ${borrowedQuantity}.`;

          return;

        }


        quantityWarning.classList
          .add('hidden');

      };


    quantityInput.addEventListener(
      'input',
      updateQuantityWarning
    );


    // ========================================
    // UPDATE
    // ========================================

    document
      .getElementById(
        'update-item-btn'
      )
      .addEventListener(
        'click',
        async () => {

          const newQuantity =
            Number(
              document.getElementById(
                'edit-quantity'
              ).value
            );


          // ----------------------------------
          // VALIDATE QUANTITY
          // ----------------------------------

          if (
            !Number.isFinite(
              newQuantity
            ) ||
            newQuantity < 1
          ) {

            Components.showToast(
              'Total quantity must be at least 1',
              'error'
            );

            return;

          }


          if (
            newQuantity <
            borrowedQuantity
          ) {

            Components.showToast(
              `Cannot reduce quantity below ${borrowedQuantity}. ${borrowedQuantity} copies are currently borrowed.`,
              'error'
            );

            return;

          }


          const payload = {

            title:
              document.getElementById(
                'edit-title'
              ).value.trim(),

            type:
              document.getElementById(
                'edit-type'
              ).value,

            category:
              document.getElementById(
                'edit-category'
              ).value.trim(),

            location:
              document.getElementById(
                'edit-location'
              ).value.trim(),

            author:
              document.getElementById(
                'edit-author'
              ).value.trim(),

            finePerDay:
              Number(
                document.getElementById(
                  'edit-fine'
                ).value
              ),

            coverUrl:
              document.getElementById(
                'edit-cover'
              ).value.trim(),

            status:
              document.getElementById(
                'edit-status'
              ).value,

            isbn:
              document.getElementById(
                'edit-isbn'
              ).value.trim() ||
              null,

            quantity:
              newQuantity

          };


          // ----------------------------------
          // VALIDATION
          // ----------------------------------

          if (
            !payload.title ||
            !payload.category
          ) {

            Components.showToast(
              'Title and category are required',
              'error'
            );

            return;

          }


          if (
            Number.isNaN(
              payload.finePerDay
            ) ||
            payload.finePerDay < 0
          ) {

            Components.showToast(
              'Fine per day must be a valid number',
              'error'
            );

            return;

          }


          const button =
            document.getElementById(
              'update-item-btn'
            );


          button.disabled =
            true;


          button.textContent =
            'Saving...';


          try {

            await API.put(
              `/api/items/${item.id}`,
              payload
            );


            Components.showToast(
              'Item updated successfully',
              'success'
            );


            window.closeModal();


            await this.render(
              container
            );

          }

          catch (err) {

            Components.showToast(
              err.message,
              'error'
            );


            button.disabled =
              false;


            button.textContent =
              'Save Changes';

          }

        }
      );

  },


  // ==========================================
  // ISBN LOOKUP
  // ==========================================

  attachIsbnLookup() {

    const lookupButton =
      document.getElementById(
        'isbn-lookup-btn'
      );


    if (!lookupButton) {

      return;

    }


    lookupButton.addEventListener(
      'click',
      async () => {

        const isbn =
          document.getElementById(
            'isbn-input'
          ).value.trim();


        const status =
          document.getElementById(
            'isbn-status'
          );


        if (!isbn) {

          Components.showToast(
            'Enter an ISBN first',
            'error'
          );

          return;

        }


        status.textContent =
          'Looking up...';


        try {

          const book =
            await API.get(
              `/api/items/lookup/isbn/${isbn}`
            );


          document.getElementById(
            'f-title'
          ).value =
            book.title || '';


          document.getElementById(
            'f-author'
          ).value =
            book.author || '';


          document.getElementById(
            'f-type'
          ).value =
            'book';


          status.textContent =
            'Fetched from Open Library ✓';


          Components.showToast(
            'Autofilled from Open Library',
            'success'
          );

        }

        catch (err) {

          status.textContent =
            err.message;

        }

      }
    );

  },


  // ==========================================
  // FORM FIELD
  // ==========================================

  formField(
    id,
    label,
    type,
    value,
    extraAttributes = ''
  ) {

    return `

      <div>

        <label
          class="
            block
            text-sm
            font-medium
            mb-1
          "
        >

          ${this.escapeHtml(
            label
          )}

        </label>


        <input
          type="${type}"
          id="${id}"
          value="${this.escapeHtml(
            value ?? ''
          )}"
          ${extraAttributes}
          class="
            w-full
            px-4
            py-2
            rounded-lg
            border
            border-slate-300
            dark:border-slate-600
            dark:bg-slate-800
          "

          ${
            label === 'Title' ||
            label === 'Category'
              ? 'required'
              : ''
          }

        >

      </div>

    `;

  },


  // ==========================================
  // GET ADD FORM DATA
  // ==========================================

  getFormPayload() {

    return {

      title:
        document.getElementById(
          'f-title'
        ).value.trim(),

      type:
        document.getElementById(
          'f-type'
        ).value,

      category:
        document.getElementById(
          'f-category'
        ).value.trim(),

      location:
        document.getElementById(
          'f-location'
        ).value.trim(),

      author:
        document.getElementById(
          'f-author'
        ).value.trim(),

      quantity:
        Number(
          document.getElementById(
            'f-quantity'
          ).value
        ),

      finePerDay:
        Number(
          document.getElementById(
            'f-fine'
          ).value
        ),

      isbn:
        document.getElementById(
          'isbn-input'
        ).value.trim() ||
        null

    };

  },


  // ==========================================
  // CSV IMPORT
  // ==========================================

  handleCsvImport(
    e,
    container
  ) {

    const file =
      e.target.files[0];


    if (!file) {

      return;

    }


    const reader =
      new FileReader();


    reader.onload =
      async event => {

        const rows =
          this.parseCsv(
            event.target.result
          );


        if (
          rows.length === 0
        ) {

          Components.showToast(
            'No valid rows found in CSV',
            'error'
          );

          return;

        }


        try {

          const result =
            await API.post(
              '/api/items/bulk-import',
              {
                items: rows
              }
            );


          Components.showToast(
            `Imported ${result.importedCount} unique items`,
            'success'
          );


          await this.render(
            container
          );

        }

        catch (err) {

          Components.showToast(
            err.message,
            'error'
          );

        }

        finally {

          e.target.value =
            '';

        }

      };


    reader.readAsText(
      file
    );

  },


  // ==========================================
  // CSV PARSER
  // ==========================================
  //
  // Supports:
  //
  // title,author,category,quantity
  //
  // OR
  //
  // title,author,category
  //
  // If quantity is missing:
  // quantity = 1
  //
  // ==========================================

  parseCsv(text) {

    const lines =
      text
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);


    if (
      lines.length < 2
    ) {

      return [];

    }


    const headers =
      this.parseCsvLine(
        lines[0]
      ).map(
        header =>
          header
            .trim()
            .replace(/^"|"$/g, '')
            .toLowerCase()
      );


    return lines
      .slice(1)
      .map(
        line => {

          const values =
            this.parseCsvLine(
              line
            );


          const row = {};


          headers.forEach(
            (
              header,
              index
            ) => {

              row[header] =
                (
                  values[index] ??
                  ''
                )
                  .trim()
                  .replace(
                    /^"|"$/g,
                    ''
                  );

            }
          );


          // ------------------------------------
          // DEFAULT QUANTITY
          // ------------------------------------

          if (
            !row.quantity
          ) {

            row.quantity =
              1;

          }


          return row;

        }
      )
      .filter(
        row =>
          row.title &&
          row.title.trim()
      );

  },


  // ==========================================
  // CSV LINE PARSER
  // ==========================================
  //
  // Handles values containing commas:
  //
  // "Harry Potter, Book 1",J.K. Rowling
  //
  // ==========================================

  parseCsvLine(line) {

    const values = [];

    let current = '';

    let insideQuotes =
      false;


    for (
      let i = 0;
      i < line.length;
      i++
    ) {

      const char =
        line[i];


      // --------------------------------------
      // QUOTE
      // --------------------------------------

      if (
        char === '"'
      ) {

        // Escaped quote:
        // ""

        if (
          insideQuotes &&
          line[i + 1] === '"'
        ) {

          current += '"';

          i++;

        }

        else {

          insideQuotes =
            !insideQuotes;

        }

      }


      // --------------------------------------
      // COMMA
      // --------------------------------------

      else if (
        char === ',' &&
        !insideQuotes
      ) {

        values.push(
          current
        );

        current =
          '';

      }


      // --------------------------------------
      // NORMAL CHARACTER
      // --------------------------------------

      else {

        current +=
          char;

      }

    }


    values.push(
      current
    );


    return values;

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