const prisma = require('../utils/prismaClient');
const { createError } = require('../middleware/errorHandler');

const ALLOWED_KEYS = [
  'AUTO_EXPIRE_ENABLED',
  'MONTHLY_PACKAGE_AMOUNT',
  'DUE_DAY',
  'GYM_NAME',
  'REMINDER_DAYS_BEFORE',
];

const getAllSettings = async () => {
  const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
  // Return as a key-value map for ease of use
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
};

const updateSetting = async (key, value) => {
  if (!ALLOWED_KEYS.includes(key)) {
    throw createError(400, `Unknown setting key: ${key}`);
  }
  return prisma.setting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
};

const updateMultipleSettings = async (updates) => {
  const results = [];
  for (const { key, value } of updates) {
    results.push(await updateSetting(key, value));
  }
  return results;
};

module.exports = { getAllSettings, updateSetting, updateMultipleSettings };
