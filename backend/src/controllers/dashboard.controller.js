const { asyncHandler } = require('../middleware/errorHandler');
const dashboardService = require('../services/dashboard.service');

const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary();
  res.json({ success: true, ...data });
});

const recentActivity = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentActivity();
  res.json({ success: true, ...data });
});

module.exports = { summary, recentActivity };
