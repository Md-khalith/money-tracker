const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Export route placed before :id route
router.get('/export', transactionController.exportCSV);
router.get('/', transactionController.getAll);
router.post('/', transactionController.create);
router.get('/:id', transactionController.getById);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.delete);

module.exports = router;
