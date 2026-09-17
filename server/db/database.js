const fs = require('fs');
const path = require('path');
const { Pool, types } = require('pg');
const { seedDatabase } = require('./seed');

// Ensure NUMERIC / DECIMAL (OID 1700) is parsed as JavaScript float instead of string
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));
// Ensure BIGINT (OID 20) is parsed as integer
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));
// Ensure DATE (OID 1082) returns as raw YYYY-MM-DD string to avoid timezone offset issues
types.setTypeParser(1082, (val) => val);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('\n⚠️  WARNING: DATABASE_URL is not set in the environment.');
  console.warn('Set DATABASE_URL in .env (or server/.env) and run me again.\n');
}

// Configure PostgreSQL connection pool for Neon
const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString && connectionString.includes('sslmode=disable')
    ? false
    : { rejectUnauthorized: false }, // Required for Neon cloud PostgreSQL
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing from environment. Set DATABASE_URL in .env and run me again.');
  }

  const client = await pool.connect();
  try {
    // 1. Verify connection
    await client.query('SELECT 1');

    // 2. Execute schema
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);

    // 3. Seed default categories
    await seedDatabase(client);

    console.log('✓ PostgreSQL / Neon database initialized successfully.');
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initializeDatabase
};
