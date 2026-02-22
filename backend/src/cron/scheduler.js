const cron = require('node-cron');
const logger = require('../utils/logger');
const reminderService = require('../services/reminder.service');

/**
 * All cron jobs run in Asia/Colombo timezone.
 * Times are specified in local Colombo time.
 */

// ── Daily 8:00 AM – Payment Reminders ─────────────────────────────────────
cron.schedule(
  '0 8 * * *',
  async () => {
    logger.info('[Cron] Running payment reminder job...');
    try {
      const result = await reminderService.sendPaymentReminders();
      logger.info(`[Cron] Payment reminders complete. Processed: ${result.processed}`);
    } catch (err) {
      logger.error(`[Cron] Payment reminder job failed: ${err.message}`);
    }
  },
  { timezone: 'Asia/Colombo' }
);

// ── Daily 8:00 AM – Birthday Wishes ───────────────────────────────────────
cron.schedule(
  '0 8 * * *',
  async () => {
    logger.info('[Cron] Running birthday wish job...');
    try {
      const result = await reminderService.sendBirthdayWishes();
      logger.info(`[Cron] Birthday wishes complete. Processed: ${result.processed}`);
    } catch (err) {
      logger.error(`[Cron] Birthday wish job failed: ${err.message}`);
    }
  },
  { timezone: 'Asia/Colombo' }
);

// ── Daily 12:01 AM – Auto-expire unpaid members ────────────────────────────
// Runs just after midnight to catch members who haven't paid on the 10th
cron.schedule(
  '1 0 * * *',
  async () => {
    logger.info('[Cron] Running auto-expire job...');
    try {
      const result = await reminderService.autoExpireUnpaidMembers();
      if (result.skipped) return;
      logger.info(`[Cron] Auto-expire complete. Expired: ${result.expired}`);
    } catch (err) {
      logger.error(`[Cron] Auto-expire job failed: ${err.message}`);
    }
  },
  { timezone: 'Asia/Colombo' }
);

logger.info('[Cron] Scheduler initialized. Jobs: payment reminders, birthday wishes, auto-expire.');
