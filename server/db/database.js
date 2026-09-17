const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { seedDatabase } = require('./seed');

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.resolve(__dirname, '../../data/money-tracker.db');

// Ensure data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
const db = new Database(dbPath);

// Enable foreign key constraints and WAL journal mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Execute schema
const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schemaSql);

// Seed default categories if needed
seedDatabase(db);

module.exports = db;
