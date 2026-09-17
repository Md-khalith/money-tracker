const db = require('../db/database');

const ALLOWED_PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Other'
];

const transactionService = {
  validateTransactionData(data) {
    const { amount, type, categoryId, paymentMethod, transactionDate } = data;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const error = new Error('Amount must be a positive number.');
      error.statusCode = 400;
      throw error;
    }

    if (!['SPENT', 'RECEIVED'].includes(type)) {
      const error = new Error("Transaction type must be 'SPENT' or 'RECEIVED'.");
      error.statusCode = 400;
      throw error;
    }

    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!category) {
      const error = new Error('Invalid category selected.');
      error.statusCode = 400;
      throw error;
    }

    if (!paymentMethod || !ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      const error = new Error(`Payment method must be one of: ${ALLOWED_PAYMENT_METHODS.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }

    if (!transactionDate || !/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      const error = new Error('Transaction date must be a valid date in YYYY-MM-DD format.');
      error.statusCode = 400;
      throw error;
    }

    return {
      amount: Number(parsedAmount.toFixed(2)),
      type,
      categoryId: Number(categoryId),
      paymentMethod,
      description: data.description ? data.description.trim() : '',
      transactionDate
    };
  },

  getTransactions(filters = {}) {
    const { startDate, endDate, type, categoryId, paymentMethod, search } = filters;

    let sql = `
      SELECT 
        t.id,
        t.amount,
        t.type,
        t.category_id AS categoryId,
        c.name AS categoryName,
        c.icon AS categoryIcon,
        t.payment_method AS paymentMethod,
        t.description,
        t.transaction_date AS transactionDate,
        t.created_at AS createdAt
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }

    if (type && ['SPENT', 'RECEIVED'].includes(type)) {
      sql += ' AND t.type = ?';
      params.push(type);
    }

    if (categoryId && !isNaN(Number(categoryId))) {
      sql += ' AND t.category_id = ?';
      params.push(Number(categoryId));
    }

    if (paymentMethod && paymentMethod !== 'All') {
      sql += ' AND t.payment_method = ?';
      params.push(paymentMethod);
    }

    if (search && search.trim()) {
      sql += ' AND (LOWER(t.description) LIKE ? OR LOWER(c.name) LIKE ?)';
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY t.transaction_date DESC, t.id DESC';

    const stmt = db.prepare(sql);
    const transactions = stmt.all(...params);

    return {
      transactions,
      total: transactions.length
    };
  },

  getTransactionById(id) {
    const stmt = db.prepare(`
      SELECT 
        t.id,
        t.amount,
        t.type,
        t.category_id AS categoryId,
        c.name AS categoryName,
        c.icon AS categoryIcon,
        t.payment_method AS paymentMethod,
        t.description,
        t.transaction_date AS transactionDate,
        t.created_at AS createdAt
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `);
    return stmt.get(id);
  },

  createTransaction(data) {
    const validated = this.validateTransactionData(data);

    const stmt = db.prepare(`
      INSERT INTO transactions (amount, type, category_id, payment_method, description, transaction_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      validated.amount,
      validated.type,
      validated.categoryId,
      validated.paymentMethod,
      validated.description,
      validated.transactionDate
    );

    return this.getTransactionById(info.lastInsertRowid);
  },

  updateTransaction(id, data) {
    const existing = this.getTransactionById(id);
    if (!existing) {
      const error = new Error('Transaction not found.');
      error.statusCode = 404;
      throw error;
    }

    const validated = this.validateTransactionData(data);

    const stmt = db.prepare(`
      UPDATE transactions
      SET amount = ?, type = ?, category_id = ?, payment_method = ?, description = ?, transaction_date = ?
      WHERE id = ?
    `);

    stmt.run(
      validated.amount,
      validated.type,
      validated.categoryId,
      validated.paymentMethod,
      validated.description,
      validated.transactionDate,
      id
    );

    return this.getTransactionById(id);
  },

  deleteTransaction(id) {
    const existing = this.getTransactionById(id);
    if (!existing) {
      const error = new Error('Transaction not found.');
      error.statusCode = 404;
      throw error;
    }

    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return { message: 'Transaction deleted successfully.' };
  },

  exportToCSV(filters = {}) {
    const { transactions } = this.getTransactions(filters);

    // Escape fields for CSV
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = ['Date', 'Description', 'Category', 'Payment Method', 'Type', 'Amount'];
    const rows = transactions.map((t) => [
      escapeCSV(t.transactionDate),
      escapeCSV(t.description || ''),
      escapeCSV(t.categoryName),
      escapeCSV(t.paymentMethod),
      escapeCSV(t.type),
      escapeCSV(t.amount.toFixed(2))
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }
};

module.exports = {
  transactionService,
  ALLOWED_PAYMENT_METHODS
};
