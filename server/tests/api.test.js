const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Use a temporary test database
const testDbPath = path.join(__dirname, '../../data/test-money-tracker.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
process.env.DATABASE_PATH = './data/test-money-tracker.db';

const db = require('../db/database');
const categoryService = require('../services/categoryService');
const { transactionService } = require('../services/transactionService');
const dashboardService = require('../services/dashboardService');

async function runTests() {
  console.log('🧪 Running Money Tracker Comprehensive Test Suite...\n');

  // Test 1: Category Seeding
  console.log('Test 1: Verify Seeded Categories');
  const categories = categoryService.getAllCategories();
  assert.strictEqual(categories.length, 10, 'Should seed 10 default categories');
  console.log('  ✓ 10 default categories seeded properly');

  // Test 2: Category CRUD
  console.log('\nTest 2: Category Creation & Updates');
  const newCat = categoryService.createCategory({ name: 'Investment', icon: '📈' });
  assert.strictEqual(newCat.name, 'Investment');
  assert.strictEqual(newCat.icon, '📈');
  console.log('  ✓ Custom category created');

  const updatedCat = categoryService.updateCategory(newCat.id, { name: 'Investments & Stocks', icon: '📊' });
  assert.strictEqual(updatedCat.name, 'Investments & Stocks');
  assert.strictEqual(updatedCat.icon, '📊');
  console.log('  ✓ Category updated');

  // Test 3: Transaction Validation & Creation
  console.log('\nTest 3: Transaction Creation & Validation');
  
  // Should reject negative or zero amount
  assert.throws(() => {
    transactionService.createTransaction({
      amount: -100,
      type: 'SPENT',
      categoryId: 1,
      paymentMethod: 'UPI',
      transactionDate: '2026-09-17'
    });
  }, /Amount must be a positive number/);
  console.log('  ✓ Negative amount rejected');

  // Create RECEIVED transaction (Salary: ₹50,000)
  const salaryCat = categories.find(c => c.name === 'Salary');
  const tx1 = transactionService.createTransaction({
    amount: 50000,
    type: 'RECEIVED',
    categoryId: salaryCat.id,
    paymentMethod: 'Bank Transfer',
    description: 'Monthly Salary',
    transactionDate: '2026-09-01'
  });
  assert.strictEqual(tx1.amount, 50000);
  assert.strictEqual(tx1.type, 'RECEIVED');
  console.log('  ✓ Received transaction created (₹50,000)');

  // Create SPENT transaction 1 (Food: ₹5,200)
  const foodCat = categories.find(c => c.name === 'Food');
  const tx2 = transactionService.createTransaction({
    amount: 5200,
    type: 'SPENT',
    categoryId: foodCat.id,
    paymentMethod: 'UPI',
    description: 'Groceries and dining',
    transactionDate: '2026-09-05'
  });
  assert.strictEqual(tx2.amount, 5200);
  assert.strictEqual(tx2.type, 'SPENT');
  console.log('  ✓ Spent transaction 1 created (Food ₹5,200)');

  // Create SPENT transaction 2 (Travel: ₹2,800)
  const travelCat = categories.find(c => c.name === 'Travel');
  const tx3 = transactionService.createTransaction({
    amount: 2800,
    type: 'SPENT',
    categoryId: travelCat.id,
    paymentMethod: 'Credit Card',
    description: 'Train tickets',
    transactionDate: '2026-09-10'
  });
  assert.strictEqual(tx3.amount, 2800);
  console.log('  ✓ Spent transaction 2 created (Travel ₹2,800)');

  // Test 4: Dashboard Aggregations
  console.log('\nTest 4: Dashboard Calculations');
  const dashboard = dashboardService.getDashboardData({
    startDate: '2026-09-01',
    endDate: '2026-09-30'
  });
  assert.strictEqual(dashboard.totalReceived, 50000);
  assert.strictEqual(dashboard.totalSpent, 8000); // 5200 + 2800
  assert.strictEqual(dashboard.balance, 42000); // 50000 - 8000
  assert.strictEqual(dashboard.spendingByCategory.length, 2);
  assert.strictEqual(dashboard.spendingByCategory[0].categoryName, 'Food');
  assert.strictEqual(dashboard.spendingByCategory[0].total, 5200);
  assert.strictEqual(dashboard.spendingByCategory[0].percentage, 65.0); // 5200 / 8000 * 100 = 65%
  assert.strictEqual(dashboard.spendingByCategory[1].categoryName, 'Travel');
  assert.strictEqual(dashboard.spendingByCategory[1].total, 2800);
  assert.strictEqual(dashboard.spendingByCategory[1].percentage, 35.0); // 2800 / 8000 * 100 = 35%
  assert.strictEqual(dashboard.recentTransactions.length, 3);
  console.log('  ✓ Dashboard totals, balance, and spending breakdown verified accurately');

  // Test 5: Transaction Filtering & Search
  console.log('\nTest 5: Transaction Filtering & Search');
  // Search by description
  const searchResult = transactionService.getTransactions({ search: 'groceries' });
  assert.strictEqual(searchResult.transactions.length, 1);
  assert.strictEqual(searchResult.transactions[0].id, tx2.id);
  console.log('  ✓ Search by description works');

  // Filter by Type
  const spentResult = transactionService.getTransactions({ type: 'SPENT' });
  assert.strictEqual(spentResult.transactions.length, 2);
  const receivedResult = transactionService.getTransactions({ type: 'RECEIVED' });
  assert.strictEqual(receivedResult.transactions.length, 1);
  console.log('  ✓ Filter by type works');

  // Filter by Payment Method
  const upiResult = transactionService.getTransactions({ paymentMethod: 'UPI' });
  assert.strictEqual(upiResult.transactions.length, 1);
  assert.strictEqual(upiResult.transactions[0].paymentMethod, 'UPI');
  console.log('  ✓ Filter by payment method works');

  // Test 6: Referential Integrity / Category Deletion Protection
  console.log('\nTest 6: Category Deletion Protection (Referential Integrity)');
  assert.throws(() => {
    categoryService.deleteCategory(foodCat.id);
  }, /Category is currently being used by transactions/);
  console.log('  ✓ Deletion prevented when category is in use');

  // Deleting unused category should succeed
  const delResult = categoryService.deleteCategory(newCat.id);
  assert.strictEqual(delResult.message, 'Category deleted successfully.');
  console.log('  ✓ Unused category deleted successfully');

  // Test 7: CSV Export
  console.log('\nTest 7: CSV Export Generation');
  const csv = transactionService.exportToCSV({
    startDate: '2026-09-01',
    endDate: '2026-09-30'
  });
  assert(csv.includes('Date,Description,Category,Payment Method,Type,Amount'), 'Header present');
  assert(csv.includes('Monthly Salary'), 'Salary row present');
  assert(csv.includes('50000.00'), 'Amount present');
  console.log('  ✓ CSV export generated with correct headers and data');

  // Test 8: Transaction Update and Delete
  console.log('\nTest 8: Transaction Update and Delete');
  const updatedTx2 = transactionService.updateTransaction(tx2.id, {
    amount: 5500,
    type: 'SPENT',
    categoryId: foodCat.id,
    paymentMethod: 'UPI',
    description: 'Groceries updated',
    transactionDate: '2026-09-05'
  });
  assert.strictEqual(updatedTx2.amount, 5500);
  assert.strictEqual(updatedTx2.description, 'Groceries updated');
  console.log('  ✓ Transaction updated successfully');

  transactionService.deleteTransaction(tx3.id);
  const afterDelete = transactionService.getTransactionById(tx3.id);
  assert.strictEqual(afterDelete, undefined);
  console.log('  ✓ Transaction deleted successfully');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');

  // Cleanup test database
  db.close();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
