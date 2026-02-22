const { asyncHandler, createError } = require('../middleware/errorHandler');
const memberService = require('../services/member.service');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

const memberBodyValidation = (isUpdate = false) => [
  (isUpdate
    ? body('fullName').optional().trim().notEmpty()
    : body('fullName').trim().notEmpty()
  ).isLength({ max: 100 }).withMessage('fullName must be at most 100 characters.'),
  (isUpdate
    ? body('phone').optional().trim()
    : body('phone').trim().notEmpty()
  ).matches(/^[\d\s+\-()]{7,20}$/).withMessage('Valid phone number required (7-20 digits/chars).'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail().withMessage('Valid email format required.'),
  body('nic').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('NIC must be at most 20 characters.'),
  body('birthday').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('birthday must be a valid date.'),
  body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('dueDate must be a valid date.'),
  body('medicalNotes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('medicalNotes must be at most 1000 characters.'),
  body('emergencyContact').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('emergencyContact must be at most 200 characters.'),
  body('status').optional().isIn(['ACTIVE', 'EXPIRED']).withMessage('status must be ACTIVE or EXPIRED.'),
];

const list = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.query;
  const result = await memberService.listMembers({ status, search, page, limit });
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const member = await memberService.getMemberById(req.params.id);
  res.json({ success: true, member });
});

const create = [
  ...memberBodyValidation(false),
  validate,
  asyncHandler(async (req, res) => {
    const member = await memberService.createMember(req.body);
    res.status(201).json({ success: true, member });
  }),
];

const update = [
  ...memberBodyValidation(true),
  validate,
  asyncHandler(async (req, res) => {
    const member = await memberService.updateMember(req.params.id, req.body);
    res.json({ success: true, member });
  }),
];

const remove = asyncHandler(async (req, res) => {
  await memberService.deleteMember(req.params.id);
  res.json({ success: true, message: 'Member deleted successfully.' });
});

module.exports = { list, getOne, create, update, remove };
