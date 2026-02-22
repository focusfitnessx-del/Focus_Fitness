const { asyncHandler, createError } = require('../middleware/errorHandler');
const memberService = require('../services/member.service');

const list = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.query;
  const result = await memberService.listMembers({ status, search, page, limit });
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const member = await memberService.getMemberById(req.params.id);
  res.json({ success: true, member });
});

const create = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  if (!fullName || !phone) throw createError(400, 'fullName and phone are required.');
  const member = await memberService.createMember(req.body);
  res.status(201).json({ success: true, member });
});

const update = asyncHandler(async (req, res) => {
  const member = await memberService.updateMember(req.params.id, req.body);
  res.json({ success: true, member });
});

const remove = asyncHandler(async (req, res) => {
  await memberService.deleteMember(req.params.id);
  res.json({ success: true, message: 'Member deleted successfully.' });
});

module.exports = { list, getOne, create, update, remove };
