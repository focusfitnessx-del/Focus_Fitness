const { asyncHandler, createError } = require('../middleware/errorHandler');
const settingService = require('../services/setting.service');
const emailService = require('../services/email.service');

const getAll = asyncHandler(async (req, res) => {
  const settings = await settingService.getAllSettings();
  res.json({ success: true, settings });
});

const update = asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) throw createError(400, 'key and value are required.');
  const setting = await settingService.updateSetting(key, value);
  res.json({ success: true, setting });
});

const updateBulk = asyncHandler(async (req, res) => {
  const { settings } = req.body;
  if (!Array.isArray(settings) || settings.length === 0) {
    throw createError(400, 'settings array is required.');
  }
  const result = await settingService.updateMultipleSettings(settings);
  res.json({ success: true, updated: result.length });
});

const sendTestEmail = asyncHandler(async (req, res) => {
  const { type, to } = req.body;
  if (!to?.trim() || !type) throw createError(400, 'type and to are required.');

  const dueDate3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const dueDate30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  let result;
  switch (type) {
    case 'welcome':
      result = await emailService.sendWelcomeEmail({
        fullName: 'Test Member',
        email: to.trim(),
        phone: '+94 77 000 1234',
        dueDate: dueDate30Days,
      });
      break;
    case 'payment_reminder':
      result = await emailService.sendPaymentReminder({
        name: 'Test Member',
        email: to.trim(),
        phone: '+94 77 000 1234',
        dueDate: dueDate3Days,
        amount: '3,000.00',
      });
      break;
    case 'birthday':
      result = await emailService.sendBirthdayWish({
        name: 'Test Member',
        email: to.trim(),
      });
      break;
    default:
      throw createError(400, `Invalid type "${type}". Use welcome, payment_reminder, or birthday.`);
  }

  res.json({ success: true, message: `Test "${type}" email sent to ${to.trim()}`, result });
});

module.exports = { getAll, update, updateBulk, sendTestEmail };
