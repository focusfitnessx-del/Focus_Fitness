const express = require('express');
const router = express.Router();
const { asyncHandler, createError } = require('../middleware/errorHandler');
const reminderService = require('../services/reminder.service');
const logger = require('../utils/logger');

// Middleware: validate x-cron-secret header
const cronAuth = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return next(createError(503, 'Cron secret not configured.'));
  if (req.headers['x-cron-secret'] !== secret) {
    logger.warn(`[Cron] Unauthorized hit on ${req.path} from ${req.ip}`);
    return next(createError(401, 'Unauthorized.'));
  }
  next();
};

router.use(cronAuth);

// POST /api/cron/payment  — run by cron-job.org at e.g. 08:00 daily
router.post('/payment', asyncHandler(async (req, res) => {
  logger.info('[Cron] Payment reminders triggered via HTTP');
  const result = await reminderService.sendPaymentReminders();
  res.json({ success: true, message: 'Payment reminders sent.', ...result });
}));

// POST /api/cron/birthday  — run by cron-job.org at 00:00 daily
router.post('/birthday', asyncHandler(async (req, res) => {
  logger.info('[Cron] Birthday wishes triggered via HTTP');
  const result = await reminderService.sendBirthdayWishes();
  res.json({ success: true, message: 'Birthday wishes sent.', ...result });
}));

// POST /api/cron/auto-expire  — run by cron-job.org at 00:05 daily
router.post('/auto-expire', asyncHandler(async (req, res) => {
  logger.info('[Cron] Auto-expire triggered via HTTP');
  const result = await reminderService.autoExpireMembers();
  res.json({ success: true, message: 'Auto-expire completed.', ...result });
}));

module.exports = router;
