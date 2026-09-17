const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { pool, initializeDatabase } = require('../db/database');
const categoryService = require('../services/categoryService');
const { transactionService } = require('../services/transactionService');
const dashboardService = require('../services/dashboardService');

async function runTests() {
  if (!process.env.DATABASE_URL) {
    console.log('\n⚠️  Skipping PostgreSQL integration tests because DATABASE_URL is not set.');
    console.log('Set DATABASE_URL in .env and run me again.\n');
    process.exit(0);
  }

  console.log('🧪 Running Money Tracker PostgreSQL / Neon Test Suite...\n');

  // Initialize DB
  await initializeDatabase();

  // Test 1: Category Seeding
  console.log('Test 1: Verify Seeded Categories');
  const categories = await categoryService.getAllCategories();
  assert(categories.length >= 10, 'Should have at least 10 default categories');
  console.log(`  ✓ Found ${categories.length} categories`);

  // Test 2: Category CRUD
  console.log('\nTest 2: Category Creation & Updates');
  const testCatName = `Test Investment ${Date.now()}`;
  const newCat = await categoryService.createCategory({ name: testCatName, icon: '📈' });
  assert.strictEqual(newCat.name, testCatName);
  assert.strictEqual(newCat.icon, '📈');
  console.log('  ✓ Custom category created');

  const updatedName = `${testCatName} Updated`;
  const updatedCat = await categoryService.updateCategory(newCat.id, { name: updatedName, icon: '📊' });
  assert.strictEqual(updatedCat.name, updatedName);
  assert.strictEqual(updatedCat.icon, '📊');
  console.log('  ✓ Category updated');

  // Test 3: Transaction Validation & Creation
  console.log('\nTest 3: Transaction Creation & Validation');
  
  // Should reject negative amount
  let threwAmount = false;
  try {
    await transactionService.createTransaction({
      amount: -100,
      type: 'SPENT',
      categoryId: newCat.id,
      paymentMethod: 'UPI',
      transactionDate: '2026-09-17'
    });
  } catch (err) {
    threwAmount = err.message.includes('Amount must be a positive number');
  }
  assert(threwAmount, 'Should reject negative amount');
  console.log('  ✓ Negative amount rejected');

  // Create RECEIVED transaction (Salary: ₹50,000)
  const salaryCat = categories.find(c => c.name === 'Salary') || newCat;
  const tx1 = await transactionService.createTransaction({
    amount: 50000,
    type: 'RECEIVED',
    categoryId: salaryCat.id,
    paymentMethod: 'Bank Transfer',
    description: 'Monthly Salary Test',
    transactionDate: '2026-09-01'
  });
  assert.strictEqual(Number(tx1.amount), 50000);
  assert.strictEqual(tx1.type, 'RECEIVED');
  console.log('  ✓ Received transaction created (₹50,000)');

  // Create SPENT transaction 1 (₹5,200)
  const tx2 = await transactionService.createTransaction({
    amount: 5200,
    type: 'SPENT',
    categoryId: newCat.id,
    paymentMethod: 'UPI',
    description: 'Groceries and dining test',
    transactionDate: '2026-09-05'
  });
  assert.strictEqual(Number(tx2.amount), 5200);
  assert.strictEqual(tx2.type, 'SPENT');
  console.log('  ✓ Spent transaction 1 created (₹5,200)');

  // Test 4: Dashboard Aggregations
  console.log('\nTest 4: Dashboard Calculations');
  const dashboard = await dashboardService.getDashboardData({
    startDate: '2026-09-01',
    endDate: '2026-09-30'
  });
  assert(dashboard.totalReceived >= 50000, 'Total received should include tx1');
  assert(dashboard.totalSpent >= 5200, 'Total spent should include tx2');
  console.log('  ✓ Dashboard calculations returned valid totals and balance');

  // Test 5: Transaction Filtering & Search
  console.log('\nTest 5: Transaction Filtering & Search');
  const searchResult = await transactionService.getTransactions({ search: 'dining test' });
  assert(searchResult.transactions.length >= 1, 'Search should find transaction');
  console.log('  ✓ Search by description works');

  const spentResult = await transactionService.getTransactions({ type: 'SPENT' });
  assert(spentResult.transactions.every(t => t.type === 'SPENT'), 'All returned are SPENT');
  console.log('  ✓ Filter by type works');

  // Test 6: Referential Integrity / Category Deletion Protection
  console.log('\nTest 6: Category Deletion Protection (Referential Integrity)');
  let threwInUse = false;
  try {
    await categoryService.deleteCategory(newCat.id);
  } catch (err) {
    threwInUse = err.message.includes('Category is currently being used by transactions');
  }
  assert(threwInUse, 'Should prevent deletion of category in use');
  console.log('  ✓ Deletion prevented when category is in use');

  // Test 7: CSV Export
  console.log('\nTest 7: CSV Export Generation');
  const csv = await transactionService.exportToCSV({
    startDate: '2026-09-01',
    endDate: '2026-09-30'
  });
  assert(csv.includes('Date,Description,Category,Payment Method,Type,Amount'), 'Header present');
  console.log('  ✓ CSV export generated with correct headers');

  // Test 8: Transaction Update and Delete
  console.log('\nTest 8: Transaction Update and Delete');
  const updatedTx2 = await transactionService.updateTransaction(tx2.id, {
    amount: 5500,
    type: 'SPENT',
    categoryId: newCat.id,
    paymentMethod: 'UPI',
    description: 'Groceries updated test',
    transactionDate: '2026-09-05'
  });
  assert.strictEqual(Number(updatedTx2.amount), 5500);
  console.log('  ✓ Transaction updated successfully');

  await transactionService.deleteTransaction(tx1.id);
  await transactionService.deleteTransaction(tx2.id);
  const afterDelete = await transactionService.getTransactionById(tx1.id);
  assert.strictEqual(afterDelete, undefined);
  console.log('  ✓ Transactions deleted successfully');

  // Now category should be deletable
  await categoryService.deleteCategory(newCat.id);
  console.log('  ✓ Unused test category cleaned up successfully');

  console.log('\n🎉 ALL POSTGRESQL TESTS PASSED SUCCESSFULLY!\n');
  await pool.end();
}

runTests().catch(async (err) => {
  console.error('\n❌ Test failure:', err);
  try { await pool.end(); } catch (e) {}
  process.exit(1);
});
