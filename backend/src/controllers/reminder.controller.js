const { asyncHandler, createError } = require('../middleware/errorHandler');
const prisma = require('../utils/prismaClient');
const reminderService = require('../services/reminder.service');

const list = asyncHandler(async (req, res) => {
  const { type, channel, status, memberId, page = 1, limit = 30 } = req.query;

  const where = {
    ...(type && { type }),
    ...(channel && { channel }),
    ...(status && { status }),
    ...(memberId && { memberId }),
  };

  const [total, logs] = await Promise.all([
    prisma.reminderLog.count({ where }),
    prisma.reminderLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: { member: { select: { fullName: true, phone: true } } },
    }),
  ]);

  res.json({ success: true, total, page: Number(page), limit: Number(limit), logs });
});

// Manual trigger endpoints (OWNER only) – useful for testing
const triggerPaymentReminders = asyncHandler(async (req, res) => {
  const result = await reminderService.sendPaymentReminders();
  res.json({ success: true, message: 'Payment reminders triggered.', ...result });
});

const triggerBirthdayWishes = asyncHandler(async (req, res) => {
  const result = await reminderService.sendBirthdayWishes();
  res.json({ success: true, message: 'Birthday wishes triggered.', ...result });
});

const triggerAutoExpire = asyncHandler(async (req, res) => {
  const result = await reminderService.autoExpireUnpaidMembers();
  res.json({ success: true, message: 'Auto-expire triggered.', ...result });
});

module.exports = { list, triggerPaymentReminders, triggerBirthdayWishes, triggerAutoExpire };
