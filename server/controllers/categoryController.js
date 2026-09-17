const categoryService = require('../services/categoryService');

const categoryController = {
  getAll(req, res, next) {
    try {
      const categories = categoryService.getAllCategories();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      const category = categoryService.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      const { name, icon } = req.body;
      const created = categoryService.createCategory({ name, icon });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const { name, icon } = req.body;
      const updated = categoryService.updateCategory(req.params.id, { name, icon });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  delete(req, res, next) {
    try {
      const result = categoryService.deleteCategory(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = categoryController;
