const Database = require('better-sqlite3');
const path = require('path');
const { seedDatabase } = require('./seed');

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.resolve(__dirname, '../../data/money-tracker.db');

const db = new Database(dbPath);

console.log('Clearing all database records...');

db.pragma('foreign_keys = OFF');
db.exec('DELETE FROM transactions;');
db.exec('DELETE FROM categories;');

try {
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'categories');");
} catch (err) {
  // sqlite_sequence might not exist if tables were never populated with autoincrement
}

db.pragma('foreign_keys = ON');

// Re-seed the 10 clean default categories
seedDatabase(db);

const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;

console.log(`Database reset complete:`);
console.log(`- Transactions: ${txCount}`);
console.log(`- Categories: ${catCount} (default seed)`);

db.close();
