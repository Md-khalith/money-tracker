const { transactionService } = require('../services/transactionService');

const transactionController = {
  async getAll(req, res, next) {
    try {
      const { startDate, endDate, type, categoryId, paymentMethod, search } = req.query;
      const result = await transactionService.getTransactions({
        startDate,
        endDate,
        type,
        categoryId,
        paymentMethod,
        search
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const transaction = await transactionService.getTransactionById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found.' });
      }
      res.json(transaction);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const created = await transactionService.createTransaction(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await transactionService.updateTransaction(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await transactionService.deleteTransaction(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async exportCSV(req, res, next) {
    try {
      const { startDate, endDate, type, categoryId, paymentMethod, search } = req.query;
      const csv = await transactionService.exportToCSV({
        startDate,
        endDate,
        type,
        categoryId,
        paymentMethod,
        search
      });

      const today = new Date().toISOString().slice(0, 10);
      const filename = (startDate && endDate)
        ? `money-tracker-${startDate}-to-${endDate}.csv`
        : `money-tracker-${today}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = transactionController;
