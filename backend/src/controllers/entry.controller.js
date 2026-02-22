const { asyncHandler, createError } = require('../middleware/errorHandler');
const entryService = require('../services/entry.service');

const checkEntry = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  if (!memberId) throw createError(400, 'memberId is required.');
  const result = await entryService.checkMemberEntry(memberId);
  const statusCode = result.allowed ? 200 : 403;
  res.status(statusCode).json({ success: true, ...result });
});

module.exports = { checkEntry };
