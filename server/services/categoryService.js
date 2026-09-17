const { pool } = require('../db/database');

const categoryService = {
  async getAllCategories() {
    const res = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.created_at AS "createdAt",
        COUNT(t.id)::int AS "transactionCount"
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      GROUP BY c.id, c.name, c.icon, c.created_at
      ORDER BY LOWER(c.name) ASC
    `);
    return res.rows;
  },

  async getCategoryById(id) {
    const res = await pool.query(
      'SELECT id, name, icon, created_at AS "createdAt" FROM categories WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async createCategory({ name, icon }) {
    if (!name || !name.trim()) {
      const error = new Error('Category name is required.');
      error.statusCode = 400;
      throw error;
    }

    const trimmedName = name.trim();
    const existing = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
      [trimmedName]
    );

    if (existing.rows.length > 0) {
      const error = new Error('A category with this name already exists.');
      error.statusCode = 409;
      throw error;
    }

    const res = await pool.query(
      'INSERT INTO categories (name, icon) VALUES ($1, $2) RETURNING id, name, icon, created_at AS "createdAt"',
      [trimmedName, icon ? icon.trim() : null]
    );

    return res.rows[0];
  },

  async updateCategory(id, { name, icon }) {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!name || !name.trim()) {
      const error = new Error('Category name is required.');
      error.statusCode = 400;
      throw error;
    }

    const trimmedName = name.trim();
    const duplicate = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
      [trimmedName, id]
    );

    if (duplicate.rows.length > 0) {
      const error = new Error('Another category with this name already exists.');
      error.statusCode = 409;
      throw error;
    }

    const res = await pool.query(
      'UPDATE categories SET name = $1, icon = $2 WHERE id = $3 RETURNING id, name, icon, created_at AS "createdAt"',
      [trimmedName, icon ? icon.trim() : null, id]
    );

    return res.rows[0];
  },

  async deleteCategory(id) {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      throw error;
    }

    const usage = await pool.query(
      'SELECT COUNT(*)::int AS count FROM transactions WHERE category_id = $1',
      [id]
    );

    if (usage.rows[0] && usage.rows[0].count > 0) {
      const error = new Error('Category is currently being used by transactions.');
      error.statusCode = 409;
      throw error;
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return { message: 'Category deleted successfully.' };
  }
};

module.exports = categoryService;
