const dashboardService = require('../services/dashboardService');

const dashboardController = {
  getDashboard(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = dashboardService.getDashboardData({ startDate, endDate });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = dashboardController;
