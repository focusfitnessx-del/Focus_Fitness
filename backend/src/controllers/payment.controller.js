const { asyncHandler, createError } = require('../middleware/errorHandler');
const paymentService = require('../services/payment.service');

const list = asyncHandler(async (req, res) => {
  const { memberId, month, year, page, limit } = req.query;
  const result = await paymentService.listPayments({ memberId, month, year, page, limit });
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  res.json({ success: true, payment });
});

const record = asyncHandler(async (req, res) => {
  const { memberId, month, year, amount, notes } = req.body;
  if (!memberId || !month || !year || !amount) {
    throw createError(400, 'memberId, month, year, and amount are required.');
  }
  const payment = await paymentService.recordPayment({
    memberId,
    month,
    year,
    amount,
    notes,
    collectedById: req.user.id,
  });
  res.status(201).json({ success: true, payment });
});

const monthlyRevenue = asyncHandler(async (req, res) => {
  const summary = await paymentService.getMonthlyRevenueSummary(req.query.year);
  res.json({ success: true, ...summary });
});

module.exports = { list, getOne, record, monthlyRevenue };
