const categoryService = require('../services/categoryService');

const categoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { name, icon } = req.body;
      const created = await categoryService.createCategory({ name, icon });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { name, icon } = req.body;
      const updated = await categoryService.updateCategory(req.params.id, { name, icon });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = categoryController;
