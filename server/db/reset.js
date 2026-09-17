const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { pool, initializeDatabase } = require('./database');
const { seedDatabase } = require('./seed');

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL is not set in .env');
    console.error('Set DATABASE_URL in .env and run me again.\n');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  const client = await pool.connect();
  try {
    console.log('Clearing all transactions and categories...');
    await client.query('TRUNCATE TABLE transactions, categories RESTART IDENTITY CASCADE');

    console.log('Re-seeding default categories...');
    await seedDatabase(client);

    const txRes = await client.query('SELECT COUNT(*)::int AS count FROM transactions');
    const catRes = await client.query('SELECT COUNT(*)::int AS count FROM categories');

    console.log('\n✓ PostgreSQL database reset complete:');
    console.log(`- Transactions: ${txRes.rows[0].count}`);
    console.log(`- Categories:   ${catRes.rows[0].count} (default seed)\n`);
  } catch (err) {
    console.error('Failed to reset database:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
