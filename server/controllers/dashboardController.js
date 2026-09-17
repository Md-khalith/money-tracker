const dashboardService = require('../services/dashboardService');

const dashboardController = {
  async getDashboard(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await dashboardService.getDashboardData({ startDate, endDate });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = dashboardController;
