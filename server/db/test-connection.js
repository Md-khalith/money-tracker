const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { pool, initializeDatabase } = require('./database');

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || !dbUrl.trim()) {
    console.log('\n❌ DATABASE_URL is not set.');
    console.log('Set DATABASE_URL in .env and run me again.\n');
    process.exit(1);
  }

  // Mask password for safe logging
  const maskedUrl = dbUrl.replace(/:\/\/(.*?):(.*?)@/, '://$1:****@');
  console.log(`\n🔍 Testing PostgreSQL connection to: ${maskedUrl}`);

  try {
    const client = await pool.connect();
    const versionRes = await client.query('SELECT version()');
    console.log('✓ Successfully connected to PostgreSQL / Neon!');
    console.log(`  Engine: ${versionRes.rows[0].version.split(' on ')[0]}`);

    // Run schema & seeds
    console.log('✓ Initializing schema & default categories...');
    await initializeDatabase();

    const catCount = await client.query('SELECT COUNT(*)::int AS count FROM categories');
    const txCount = await client.query('SELECT COUNT(*)::int AS count FROM transactions');
    console.log(`  • Categories:   ${catCount.rows[0].count}`);
    console.log(`  • Transactions: ${txCount.rows[0].count}`);

    console.log('\n🎉 Neon PostgreSQL connection and initialization verified successfully!\n');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PostgreSQL Connection Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
