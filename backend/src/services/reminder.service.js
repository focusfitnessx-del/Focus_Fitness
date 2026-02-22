const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');
const emailService = require('./email.service');
const whatsappService = require('./whatsapp.service');

/**
 * Logs a reminder attempt to the database.
 */
const logReminder = async ({ memberId, type, channel, status, message, error }) => {
  try {
    await prisma.reminderLog.create({
      data: { memberId, type, channel, status, message: message || null, error: error || null },
    });
  } catch (err) {
    logger.error(`[Reminder] Failed to log reminder for member ${memberId}: ${err.message}`);
  }
};

/**
 * Sends payment due reminders to members whose due date is within N days.
 * N is read from the REMINDER_DAYS_BEFORE setting (default: 3).
 */
const sendPaymentReminders = async () => {
  const setting = await prisma.setting.findUnique({ where: { key: 'REMINDER_DAYS_BEFORE' } });
  const daysBefore = parseInt(setting?.value || '3');
  const amountSetting = await prisma.setting.findUnique({ where: { key: 'MONTHLY_PACKAGE_AMOUNT' } });
  const amount = amountSetting?.value || '3000';

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBefore);

  // Match members with dueDate on the target date
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

  const members = await prisma.member.findMany({
    where: {
      status: 'ACTIVE',
      dueDate: { gte: startOfDay, lt: endOfDay },
    },
  });

  logger.info(`[Reminder] Found ${members.length} members with payment due in ${daysBefore} days.`);

  const dueDateStr = startOfDay.toLocaleDateString('en-LK', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo',
  });

  for (const member of members) {
    // Email
    try {
      const result = await emailService.sendPaymentReminder({
        name: member.fullName,
        email: member.email,
        phone: member.phone,
        dueDate: dueDateStr,
        amount,
      });
      await logReminder({
        memberId: member.id,
        type: 'PAYMENT_DUE',
        channel: 'EMAIL',
        status: result.skipped ? 'SKIPPED' : 'SENT',
        message: `Payment reminder for ${dueDateStr}`,
      });
    } catch (err) {
      logger.error(`[Reminder] Email failed for ${member.fullName}: ${err.message}`);
      await logReminder({ memberId: member.id, type: 'PAYMENT_DUE', channel: 'EMAIL', status: 'FAILED', error: err.message });
    }

    // WhatsApp
    try {
      const result = await whatsappService.sendPaymentReminderWhatsApp({
        name: member.fullName,
        phone: member.phone,
        dueDate: dueDateStr,
        amount,
      });
      await logReminder({
        memberId: member.id,
        type: 'PAYMENT_DUE',
        channel: 'WHATSAPP',
        status: result.placeholder ? 'SKIPPED' : 'SENT',
        message: `Payment reminder for ${dueDateStr}`,
      });
    } catch (err) {
      logger.error(`[Reminder] WhatsApp failed for ${member.fullName}: ${err.message}`);
      await logReminder({ memberId: member.id, type: 'PAYMENT_DUE', channel: 'WHATSAPP', status: 'FAILED', error: err.message });
    }
  }

  return { processed: members.length };
};

/**
 * Sends birthday wishes to members whose birthday is today.
 */
const sendBirthdayWishes = async () => {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  // Use raw query to compare month/day ignoring year
  const members = await prisma.$queryRaw`
    SELECT * FROM members
    WHERE deleted_at IS NULL
    AND EXTRACT(MONTH FROM birthday) = ${todayMonth}
    AND EXTRACT(DAY FROM birthday) = ${todayDay}
  `;

  logger.info(`[Birthday] Found ${members.length} members with birthdays today.`);

  for (const member of members) {
    // Email
    try {
      const result = await emailService.sendBirthdayWish({ name: member.full_name, email: member.email });
      await logReminder({
        memberId: member.id,
        type: 'BIRTHDAY',
        channel: 'EMAIL',
        status: result.skipped ? 'SKIPPED' : 'SENT',
        message: 'Birthday wish sent',
      });
    } catch (err) {
      logger.error(`[Birthday] Email failed for ${member.full_name}: ${err.message}`);
      await logReminder({ memberId: member.id, type: 'BIRTHDAY', channel: 'EMAIL', status: 'FAILED', error: err.message });
    }

    // WhatsApp
    try {
      const result = await whatsappService.sendBirthdayWhatsApp({ name: member.full_name, phone: member.phone });
      await logReminder({
        memberId: member.id,
        type: 'BIRTHDAY',
        channel: 'WHATSAPP',
        status: result.placeholder ? 'SKIPPED' : 'SENT',
        message: 'Birthday wish sent',
      });
    } catch (err) {
      logger.error(`[Birthday] WhatsApp failed for ${member.full_name}: ${err.message}`);
      await logReminder({ memberId: member.id, type: 'BIRTHDAY', channel: 'WHATSAPP', status: 'FAILED', error: err.message });
    }
  }

  return { processed: members.length };
};

/**
 * Auto-expires members who have not paid by the 10th.
 * Only runs if the AUTO_EXPIRE_ENABLED setting is 'true'.
 */
const autoExpireUnpaidMembers = async () => {
  const setting = await prisma.setting.findUnique({ where: { key: 'AUTO_EXPIRE_ENABLED' } });
  if (setting?.value !== 'true') {
    logger.info('[AutoExpire] Disabled by settings. Skipping.');
    return { skipped: true };
  }

  const now = new Date();
  const expireResult = await prisma.member.updateMany({
    where: {
      status: 'ACTIVE',
      dueDate: { lt: now },
    },
    data: { status: 'EXPIRED' },
  });

  logger.info(`[AutoExpire] Expired ${expireResult.count} members.`);
  return { expired: expireResult.count };
};

module.exports = { sendPaymentReminders, sendBirthdayWishes, autoExpireUnpaidMembers, logReminder };
