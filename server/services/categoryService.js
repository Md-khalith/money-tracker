const db = require('../db/database');

const categoryService = {
  getAllCategories() {
    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.created_at AS createdAt,
        COUNT(t.id) AS transactionCount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      GROUP BY c.id
      ORDER BY c.name COLLATE NOCASE ASC
    `);
    return stmt.all();
  },

  getCategoryById(id) {
    const stmt = db.prepare('SELECT id, name, icon, created_at AS createdAt FROM categories WHERE id = ?');
    return stmt.get(id);
  },

  createCategory({ name, icon }) {
    if (!name || !name.trim()) {
      const error = new Error('Category name is required.');
      error.statusCode = 400;
      throw error;
    }

    const trimmedName = name.trim();
    const existing = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)').get(trimmedName);
    if (existing) {
      const error = new Error('A category with this name already exists.');
      error.statusCode = 409;
      throw error;
    }

    const stmt = db.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)');
    const info = stmt.run(trimmedName, icon ? icon.trim() : null);

    return this.getCategoryById(info.lastInsertRowid);
  },

  updateCategory(id, { name, icon }) {
    const existing = this.getCategoryById(id);
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
    const duplicate = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmedName, id);
    if (duplicate) {
      const error = new Error('Another category with this name already exists.');
      error.statusCode = 409;
      throw error;
    }

    const stmt = db.prepare('UPDATE categories SET name = ?, icon = ? WHERE id = ?');
    stmt.run(trimmedName, icon ? icon.trim() : null, id);

    return this.getCategoryById(id);
  },

  deleteCategory(id) {
    const existing = this.getCategoryById(id);
    if (!existing) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      throw error;
    }

    const usage = db.prepare('SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?').get(id);
    if (usage && usage.count > 0) {
      const error = new Error('Category is currently being used by transactions.');
      error.statusCode = 409;
      throw error;
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return { message: 'Category deleted successfully.' };
  }
};

module.exports = categoryService;
