# ResourceHub — Library & Lab Equipment Booking System

Role-based library and lab-equipment booking system built to demonstrate a
30-point JavaScript curriculum end to end, with three differentiators most
similar student projects skip: **time-slot booking with conflict detection**
for lab equipment, a **transparent priority waitlist algorithm**, and
**condition-based fine calculation** on return.

No external database or services required — data persists to a local JSON
file, and the whole app (API + frontend) runs from a single Node process.

## Setup

```bash
npm install
npm start
```

Open **http://localhost:5000**. Demo data is seeded automatically on first run.

Demo accounts (password: `password123`):

| Email | Role |
|---|---|
| alice@uni.edu | student |
| bob@uni.edu | faculty |
| carol@uni.edu | admin |
| dave@uni.edu | lab_manager |

To reset to fresh demo data at any time:

```bash
npm run seed
```

## What's implemented

- **Auth** — register/login with JWT, role-based routing (student, faculty,
  admin, lab_manager)
- **Catalog** — search, filter by type/category, mixed books + lab equipment
- **Borrowing** — 14-day book checkout with double-checkout prevention
- **Equipment booking** — visual 14-day timeline per item; booking a slot
  server-side checks for date-range overlap and rejects conflicts (409)
- **Returns** — condition assessment (1–10 rating + damage note) on return;
  late fee and condition-damage fee calculated automatically and added to
  the user's fines
- **Waitlist** — priority score = weighted blend of role, reliability score,
  urgency, and time waited; breakdown is shown in the UI, not hidden
- **Fines** — view and pay outstanding fines
- **Admin analytics** — most-borrowed items, category usage, overdue trend,
  fines collected/outstanding (Chart.js)
- **Admin item management** — add/delete items, ISBN autofill via the Open
  Library API, CSV bulk import

## Project structure

```
server/
  server.js              Express app entry, serves API + static frontend
  db.js                  JSON-file persistence layer (stands in for MongoDB)
  data/seed.js           Demo data generator
  middleware/auth.js      JWT verification
  middleware/rbac.js      Role-based access control
  utils/priorityAlgorithm.js   Waitlist scoring
  utils/fineCalculator.js      Late fee + condition fine math
  routes/                 auth, items, reservations, waitlist, fines, analytics

client/
  index.html
  css/styles.css
  js/
    app.js               Router + RBAC-aware navigation
    auth.js               Login/register/session
    api.js                Fetch wrapper
    storage.js            localStorage wrapper
    components.js         Sidebar, cards, toasts, modal
    dashboard.js          Personal overview + return flow
    catalog.js            Browse/search/filter/borrow
    timeline.js           Equipment time-slot booking calendar
    waitlist.js            Priority waitlist view
    fines.js               Fines & payment
    adminDashboard.js      Analytics charts
    adminItems.js          Item CRUD, ISBN autofill, CSV import
```

## Curriculum coverage (30-point JS syllabus)

| Points | Where |
|---|---|
| 1-4 Variables, data types, type conversion, operators | Throughout; fine math in `fineCalculator.js` |
| 5-6 Loops | `db.js` iteration, timeline day generation |
| 7-8 Functions, params, return values | `priorityAlgorithm.js`, `fineCalculator.js` |
| 9-10 Arrow functions, scope, arrays | `api.js`, `catalog.js` filters |
| 11-12 Array methods (push/filter/sort/slice) | `catalog.js`, `waitlist.js` |
| 13-14 Higher-order functions (map/filter/reduce/sort) | `analytics.js` aggregation, `waitlist.js` sort |
| 15-16 Objects, destructuring, JSON | `priorityAlgorithm.js`, all API payloads |
| 17-20 DOM selection & manipulation | `components.js`, every page module |
| 21 Event handling | `app.js` global listeners, form/click handlers |
| 22 Forms & validation | login/register, add-item form |
| 23 Local/session storage | `storage.js` (token, user, theme) |
| 24 ES6 features | template literals, spread/rest, destructuring throughout |
| 25-26 Promises, error handling | `api.js`, `Promise.all` in `dashboard.js` |
| 27-28 Async/await, Fetch API, JSON | `api.js`, ISBN lookup, every route handler |
| 29-30 Mini project integration | the whole app |

## Extending it further

- Swap `db.js` for a real MongoDB/Postgres connection — the collection-style
  API (`get`, `find`, `insert`, `update`, `remove`) maps directly onto
  Mongoose/Sequelize calls, so routes barely change.
- Add QR-code scanning and offline PWA support once the core is stable —
  they were left out here to keep the project reliably runnable, not
  because they're bad ideas.
