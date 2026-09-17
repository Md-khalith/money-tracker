const db = require('../db/database');

const dashboardService = {
  getDashboardData(filters = {}) {
    const { startDate, endDate } = filters;

    let dateClause = '';
    const dateParams = [];

    if (startDate && endDate) {
      dateClause = ' WHERE transaction_date BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    } else if (startDate) {
      dateClause = ' WHERE transaction_date >= ?';
      dateParams.push(startDate);
    } else if (endDate) {
      dateClause = ' WHERE transaction_date <= ?';
      dateParams.push(endDate);
    }

    // 1. Calculate Total Received and Total Spent
    const totalsSql = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'RECEIVED' THEN amount ELSE 0 END), 0) AS totalReceived,
        COALESCE(SUM(CASE WHEN type = 'SPENT' THEN amount ELSE 0 END), 0) AS totalSpent
      FROM transactions
      ${dateClause}
    `;
    const totalsRow = db.prepare(totalsSql).get(...dateParams);
    const totalReceived = Number(totalsRow.totalReceived || 0);
    const totalSpent = Number(totalsRow.totalSpent || 0);
    const balance = Number((totalReceived - totalSpent).toFixed(2));

    // 2. Spending by Category
    let categorySql = `
      SELECT 
        c.id AS categoryId,
        c.name AS categoryName,
        c.icon,
        COALESCE(SUM(t.amount), 0) AS total
      FROM categories c
      JOIN transactions t ON c.id = t.category_id
      WHERE t.type = 'SPENT'
    `;
    const catParams = [];

    if (startDate && endDate) {
      categorySql += ' AND t.transaction_date BETWEEN ? AND ?';
      catParams.push(startDate, endDate);
    } else if (startDate) {
      categorySql += ' AND t.transaction_date >= ?';
      catParams.push(startDate);
    } else if (endDate) {
      categorySql += ' AND t.transaction_date <= ?';
      catParams.push(endDate);
    }

    categorySql += ' GROUP BY c.id ORDER BY total DESC';
    const rawCategories = db.prepare(categorySql).all(...catParams);

    const spendingByCategory = rawCategories.map((item) => {
      const itemTotal = Number(item.total);
      const percentage = totalSpent > 0 ? Number(((itemTotal / totalSpent) * 100).toFixed(1)) : 0;
      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        icon: item.icon,
        total: Number(itemTotal.toFixed(2)),
        percentage
      };
    });

    // 3. Recent Transactions (latest 5)
    let recentSql = `
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
    `;
    const recentParams = [];

    if (dateClause) {
      recentSql += dateClause.replace(/transaction_date/g, 't.transaction_date');
      recentParams.push(...dateParams);
    }

    recentSql += ' ORDER BY t.transaction_date DESC, t.id DESC LIMIT 5';
    const recentTransactions = db.prepare(recentSql).all(...recentParams);

    return {
      totalReceived: Number(totalReceived.toFixed(2)),
      totalSpent: Number(totalSpent.toFixed(2)),
      balance,
      spendingByCategory,
      recentTransactions
    };
  }
};

module.exports = dashboardService;
