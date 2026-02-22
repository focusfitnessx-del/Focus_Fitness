const prisma = require('../utils/prismaClient');

const getSummary = async () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();

  const [
    totalMembers,
    activeMembers,
    expiredMembers,
    currentMonthRevResult,
    lastMonthRevResult,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { status: 'ACTIVE' } }),
    prisma.member.count({ where: { status: 'EXPIRED' } }),
    prisma.payment.aggregate({
      where: { month: currentMonth, year: currentYear },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.aggregate({
      where: { month: lastMonth, year: lastMonthYear },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  return {
    totalMembers,
    activeMembers,
    expiredMembers,
    currentMonthRevenue: parseFloat(currentMonthRevResult._sum.amount ?? 0),
    currentMonthPaymentsCount: currentMonthRevResult._count.id,
    lastMonthRevenue: parseFloat(lastMonthRevResult._sum.amount ?? 0),
    lastMonthPaymentsCount: lastMonthRevResult._count.id,
  };
};

const getRecentActivity = async () => {
  const [recentPayments, recentMembers] = await Promise.all([
    prisma.payment.findMany({
      take: 5,
      orderBy: { paidDate: 'desc' },
      include: {
        member: { select: { fullName: true, phone: true } },
        collectedBy: { select: { name: true } },
      },
    }),
    prisma.member.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, phone: true, status: true, createdAt: true },
    }),
  ]);

  return { recentPayments, recentMembers };
};

module.exports = { getSummary, getRecentActivity };
