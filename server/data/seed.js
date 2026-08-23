// ============================================
// SEED.JS - Demo data generator
// Run directly with `npm run seed` to reset data,
// or import generateSeedData() elsewhere (used by db.js
// to auto-seed on first boot).
// ============================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'db.json');
const uid = () => crypto.randomUUID();
const hash = (pw) => bcrypt.hashSync(pw, 8);

function generateSeedData() {
  const now = Date.now();
  const days = (n) => new Date(now + n * 86400000).toISOString();

  const users = [
    { id: uid(), name: 'Alice Student', email: 'alice@uni.edu', password: hash('password123'), role: 'student', reliabilityScore: 88, createdAt: days(-120) },
    { id: uid(), name: 'Bob Faculty', email: 'bob@uni.edu', password: hash('password123'), role: 'faculty', reliabilityScore: 95, createdAt: days(-200) },
    { id: uid(), name: 'Carol Admin', email: 'carol@uni.edu', password: hash('password123'), role: 'admin', reliabilityScore: 100, createdAt: days(-365) },
    { id: uid(), name: 'Dave Lab Manager', email: 'dave@uni.edu', password: hash('password123'), role: 'lab_manager', reliabilityScore: 97, createdAt: days(-300) }
  ];

  const items = [
    { id: uid(), title: 'Clean Code', type: 'book', category: 'Software Engineering', status: 'available', location: 'Shelf B-12', finePerDay: 2, isbn: '9780132350884', author: 'Robert C. Martin', coverUrl: null, conditionRating: 9 },
    { id: uid(), title: 'Introduction to Algorithms', type: 'book', category: 'Computer Science', status: 'available', location: 'Shelf A-04', finePerDay: 2, isbn: '9780262033848', author: 'Cormen, Leiserson, Rivest, Stein', coverUrl: null, conditionRating: 8 },
    { id: uid(), title: 'Digital Oscilloscope (Tektronix)', type: 'equipment', category: 'Electronics Lab', status: 'available', location: 'Lab 3 - Bench 2', finePerDay: 10, isbn: null, author: null, coverUrl: null, conditionRating: 9 },
    { id: uid(), title: 'Arduino Starter Kit', type: 'equipment', category: 'Electronics Lab', status: 'available', location: 'Lab 3 - Cabinet 1', finePerDay: 5, isbn: null, author: null, coverUrl: null, conditionRating: 10 },
    { id: uid(), title: 'DSLR Camera (Canon 90D)', type: 'equipment', category: 'Media Lab', status: 'available', location: 'Media Room 1', finePerDay: 15, isbn: null, author: null, coverUrl: null, conditionRating: 7 },
    { id: uid(), title: 'Clean Architecture', type: 'book', category: 'Software Engineering', status: 'available', location: 'Shelf B-13', finePerDay: 2, isbn: '9780134494166', author: 'Robert C. Martin', coverUrl: null, conditionRating: 9 }
  ];

  return { users, items, reservations: [], waitlist: [], fines: [] };
}

function writeSeedToDisk() {
  const data = generateSeedData();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('Seed complete. Demo accounts (password: password123):');
  data.users.forEach(u => console.log(`  ${u.email}  ->  ${u.role}`));
  return data;
}

module.exports = { generateSeedData, writeSeedToDisk };

// Only run automatically when executed directly (`npm run seed`)
if (require.main === module) {
  writeSeedToDisk();
}
