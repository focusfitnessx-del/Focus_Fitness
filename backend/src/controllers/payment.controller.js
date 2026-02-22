const { asyncHandler, createError } = require('../middleware/errorHandler');
const paymentService = require('../services/payment.service');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

const recordValidation = [
  body('memberId').isUUID().withMessage('Valid memberId (UUID) is required.'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('month must be between 1 and 12.'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('year must be a valid 4-digit year.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount must be a positive number.'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('notes must be at most 500 characters.'),
];

const list = asyncHandler(async (req, res) => {
  const { memberId, month, year, page, limit } = req.query;
  const result = await paymentService.listPayments({ memberId, month, year, page, limit });
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  res.json({ success: true, payment });
});

const record = [
  ...recordValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { memberId, month, year, amount, notes } = req.body;
    const payment = await paymentService.recordPayment({
      memberId,
      month: Number(month),
      year: Number(year),
      amount,
      notes,
      collectedById: req.user.id,
    });
    res.status(201).json({ success: true, payment });
  }),
];

const monthlyRevenue = asyncHandler(async (req, res) => {
  const summary = await paymentService.getMonthlyRevenueSummary(req.query.year);
  res.json({ success: true, ...summary });
});

module.exports = { list, getOne, record, monthlyRevenue };
