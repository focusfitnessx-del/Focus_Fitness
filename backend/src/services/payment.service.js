const prisma = require('../utils/prismaClient');
const { createError } = require('../middleware/errorHandler');
const { sendPaymentReceiptEmail } = require('./email.service');

/**
 * Generates a receipt number: FF-YYYYMM-XXXX (e.g. FF-202602-0001)
 */
const generateReceiptNumber = async (month, year) => {
  const prefix = `FF-${year}${String(month).padStart(2, '0')}`;
  const latest = await prisma.payment.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
  });
  let seq = 1;
  if (latest) {
    const parts = latest.receiptNumber.split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }
  return `${prefix}-${String(seq).padStart(4, '0')}`;
};

/**
 * Calculates the next due date (10th of next month) relative to a given date.
 */
const nextDueDate = (fromDate) => {
  const d = new Date(fromDate);
  return new Date(d.getFullYear(), d.getMonth() + 1, 10);
};

const recordPayment = async ({ memberId, month, year, amount, notes, collectedById, paymentType }) => {
  if (!memberId || !month || !year || !amount) {
    throw createError(400, 'memberId, month, year, and amount are required.');
  }

  const resolvedType = paymentType === 'ADMISSION' ? 'ADMISSION' : 'MONTHLY';

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw createError(404, 'Member not found.');

  // Prevent duplicate MONTHLY payment for same member/month/year
  if (resolvedType === 'MONTHLY') {
    const existing = await prisma.payment.findFirst({
      where: { memberId, month: Number(month), year: Number(year), paymentType: 'MONTHLY' },
    });
    if (existing) throw createError(409, `Monthly payment for ${month}/${year} already recorded for this member.`);
  }

  const receiptNumber = await generateReceiptNumber(month, year);

  let payment;
  let updatedMember;

  if (resolvedType === 'MONTHLY') {
    // MONTHLY: create payment + advance member due date in a transaction
    [payment, updatedMember] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          receiptNumber,
          memberId,
          month: Number(month),
          year: Number(year),
          amount: parseFloat(amount),
          collectedById,
          notes: notes || null,
          paymentType: 'MONTHLY',
        },
        include: {
          member: { select: { fullName: true, phone: true, email: true } },
          collectedBy: { select: { name: true } },
        },
      }),
      prisma.member.update({
        where: { id: memberId },
        data: {
          status: 'ACTIVE',
          dueDate: nextDueDate(new Date(year, month - 1, 10)),
        },
      }),
    ]);
  } else {
    // ADMISSION: record payment only — do not alter dueDate or status
    payment = await prisma.payment.create({
      data: {
        receiptNumber,
        memberId,
        month: Number(month),
        year: Number(year),
        amount: parseFloat(amount),
        collectedById,
        notes: notes || null,
        paymentType: 'ADMISSION',
      },
      include: {
        member: { select: { fullName: true, phone: true, email: true } },
        collectedBy: { select: { name: true } },
      },
    });
    updatedMember = member;
  }

  // Send receipt email (fire-and-forget — don't fail the request if email errors)
  sendPaymentReceiptEmail({
    name: payment.member.fullName,
    email: payment.member.email,
    receiptNumber: payment.receiptNumber,
    amount: payment.amount,
    month: payment.month,
    year: payment.year,
    collectedBy: payment.collectedBy?.name,
    nextDueDate: updatedMember.dueDate,
  }).catch((err) => console.warn('[Email] Receipt email failed:', err.message));

  return payment;
};

const listPayments = async ({ memberId, month, year, page = 1, limit = 20 }) => {
  const where = {
    ...(memberId && { memberId }),
    ...(month && { month: Number(month) }),
    ...(year && { year: Number(year) }),
  };

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { paidDate: 'desc' },
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        member: { select: { fullName: true, phone: true } },
        collectedBy: { select: { name: true } },
      },
    }),
  ]);

  return { total, page: Number(page), limit: Number(limit), payments };
};

const getPaymentById = async (id) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      member: true,
      collectedBy: { select: { name: true } },
    },
  });
  if (!payment) throw createError(404, 'Payment not found.');
  return payment;
};

const getMonthlyRevenueSummary = async (year) => {
  const targetYear = year ? Number(year) : new Date().getFullYear();

  const rows = await prisma.payment.groupBy({
    by: ['month'],
    where: { year: targetYear },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { month: 'asc' },
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const found = rows.find((r) => r.month === i + 1);
    return {
      month: i + 1,
      revenue: found ? parseFloat(found._sum.amount) : 0,
      count: found ? found._count.id : 0,
    };
  });

  const totalRevenue = months.reduce((sum, m) => sum + m.revenue, 0);
  return { year: targetYear, months, totalRevenue };
};

module.exports = { recordPayment, listPayments, getPaymentById, getMonthlyRevenueSummary };
