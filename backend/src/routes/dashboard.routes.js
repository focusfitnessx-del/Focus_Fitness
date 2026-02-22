const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/summary', dashboardController.summary);
router.get('/recent-activity', dashboardController.recentActivity);

module.exports = router;
