const { pool } = require('../db/database');

const ALLOWED_PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Other'
];

const transactionService = {
  async validateTransactionData(data) {
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

    const category = await pool.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
    if (category.rows.length === 0) {
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

  async getTransactions(filters = {}) {
    const { startDate, endDate, type, categoryId, paymentMethod, search } = filters;

    let sql = `
      SELECT 
        t.id,
        t.amount::numeric AS amount,
        t.type,
        t.category_id AS "categoryId",
        c.name AS "categoryName",
        c.icon AS "categoryIcon",
        t.payment_method AS "paymentMethod",
        t.description,
        to_char(t.transaction_date, 'YYYY-MM-DD') AS "transactionDate",
        t.created_at AS "createdAt"
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      params.push(startDate);
      sql += ` AND t.transaction_date >= $${params.length}::date`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND t.transaction_date <= $${params.length}::date`;
    }

    if (type && ['SPENT', 'RECEIVED'].includes(type)) {
      params.push(type);
      sql += ` AND t.type = $${params.length}`;
    }

    if (categoryId && !isNaN(Number(categoryId))) {
      params.push(Number(categoryId));
      sql += ` AND t.category_id = $${params.length}`;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      params.push(paymentMethod);
      sql += ` AND t.payment_method = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(COALESCE(t.description, '')) LIKE $${params.length} OR LOWER(c.name) LIKE $${params.length})`;
    }

    sql += ' ORDER BY t.transaction_date DESC, t.id DESC';

    const res = await pool.query(sql, params);
    const transactions = res.rows.map((t) => ({
      ...t,
      amount: Number(t.amount)
    }));

    return {
      transactions,
      total: transactions.length
    };
  },

  async getTransactionById(id) {
    const res = await pool.query(`
      SELECT 
        t.id,
        t.amount::numeric AS amount,
        t.type,
        t.category_id AS "categoryId",
        c.name AS "categoryName",
        c.icon AS "categoryIcon",
        t.payment_method AS "paymentMethod",
        t.description,
        to_char(t.transaction_date, 'YYYY-MM-DD') AS "transactionDate",
        t.created_at AS "createdAt"
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1
    `, [id]);

    if (res.rows.length === 0) return undefined;

    const row = res.rows[0];
    return {
      ...row,
      amount: Number(row.amount)
    };
  },

  async createTransaction(data) {
    const validated = await this.validateTransactionData(data);

    const res = await pool.query(`
      INSERT INTO transactions (amount, type, category_id, payment_method, description, transaction_date)
      VALUES ($1, $2, $3, $4, $5, $6::date)
      RETURNING id
    `, [
      validated.amount,
      validated.type,
      validated.categoryId,
      validated.paymentMethod,
      validated.description,
      validated.transactionDate
    ]);

    return this.getTransactionById(res.rows[0].id);
  },

  async updateTransaction(id, data) {
    const existing = await this.getTransactionById(id);
    if (!existing) {
      const error = new Error('Transaction not found.');
      error.statusCode = 404;
      throw error;
    }

    const validated = await this.validateTransactionData(data);

    await pool.query(`
      UPDATE transactions
      SET amount = $1, type = $2, category_id = $3, payment_method = $4, description = $5, transaction_date = $6::date
      WHERE id = $7
    `, [
      validated.amount,
      validated.type,
      validated.categoryId,
      validated.paymentMethod,
      validated.description,
      validated.transactionDate,
      id
    ]);

    return this.getTransactionById(id);
  },

  async deleteTransaction(id) {
    const existing = await this.getTransactionById(id);
    if (!existing) {
      const error = new Error('Transaction not found.');
      error.statusCode = 404;
      throw error;
    }

    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
    return { message: 'Transaction deleted successfully.' };
  },

  async exportToCSV(filters = {}) {
    const { transactions } = await this.getTransactions(filters);

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
      escapeCSV(Number(t.amount).toFixed(2))
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }
};

module.exports = {
  transactionService,
  ALLOWED_PAYMENT_METHODS
};
