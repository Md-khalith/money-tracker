const { pool } = require('../db/database');

const dashboardService = {
  async getDashboardData(filters = {}) {
    const { startDate, endDate } = filters;

    let dateClause = '';
    const dateParams = [];

    if (startDate && endDate) {
      dateParams.push(startDate, endDate);
      dateClause = ' WHERE transaction_date BETWEEN $1::date AND $2::date';
    } else if (startDate) {
      dateParams.push(startDate);
      dateClause = ' WHERE transaction_date >= $1::date';
    } else if (endDate) {
      dateParams.push(endDate);
      dateClause = ' WHERE transaction_date <= $1::date';
    }

    // 1. Calculate Total Received and Total Spent
    const totalsSql = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'RECEIVED' THEN amount ELSE 0 END), 0)::numeric AS "totalReceived",
        COALESCE(SUM(CASE WHEN type = 'SPENT' THEN amount ELSE 0 END), 0)::numeric AS "totalSpent"
      FROM transactions
      ${dateClause}
    `;
    const totalsRes = await pool.query(totalsSql, dateParams);
    const totalReceived = Number(Number(totalsRes.rows[0].totalReceived || 0).toFixed(2));
    const totalSpent = Number(Number(totalsRes.rows[0].totalSpent || 0).toFixed(2));
    const balance = Number((totalReceived - totalSpent).toFixed(2));

    // 2. Spending by Category
    let categorySql = `
      SELECT 
        c.id AS "categoryId",
        c.name AS "categoryName",
        c.icon,
        COALESCE(SUM(t.amount), 0)::numeric AS total
      FROM categories c
      JOIN transactions t ON c.id = t.category_id
      WHERE t.type = 'SPENT'
    `;
    const catParams = [];

    if (startDate && endDate) {
      catParams.push(startDate, endDate);
      categorySql += ' AND t.transaction_date BETWEEN $1::date AND $2::date';
    } else if (startDate) {
      catParams.push(startDate);
      categorySql += ' AND t.transaction_date >= $1::date';
    } else if (endDate) {
      catParams.push(endDate);
      categorySql += ' AND t.transaction_date <= $1::date';
    }

    categorySql += ' GROUP BY c.id, c.name, c.icon ORDER BY total DESC';
    const catRes = await pool.query(categorySql, catParams);

    const spendingByCategory = catRes.rows.map((item) => {
      const itemTotal = Number(Number(item.total).toFixed(2));
      const percentage = totalSpent > 0 ? Number(((itemTotal / totalSpent) * 100).toFixed(1)) : 0;
      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        icon: item.icon,
        total: itemTotal,
        percentage
      };
    });

    // 3. Recent Transactions (latest 5)
    let recentSql = `
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
    `;
    const recentParams = [];

    if (dateClause) {
      recentSql += dateClause.replace(/transaction_date/g, 't.transaction_date');
      recentParams.push(...dateParams);
    }

    recentSql += ' ORDER BY t.transaction_date DESC, t.id DESC LIMIT 5';
    const recentRes = await pool.query(recentSql, recentParams);

    return {
      totalReceived,
      totalSpent,
      balance,
      spendingByCategory,
      recentTransactions: recentRes.rows.map((r) => ({
        ...r,
        amount: Number(r.amount)
      }))
    };
  }
};

module.exports = dashboardService;
