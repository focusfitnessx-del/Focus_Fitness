const prisma = require('../utils/prismaClient');
const { createError } = require('../middleware/errorHandler');
const emailService = require('./email.service');
const logger = require('../utils/logger');

/**
 * Builds the next due date: the 10th of the current (or next) month.
 */
const buildDueDate = () => {
  const now = new Date();
  const dueDay = 10;
  let dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (now.getDate() > dueDay) {
    dueDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  }
  return dueDate;
};

const listMembers = async ({ status, search, page = 1, limit = 20 }) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const safeSearch = search ? String(search).slice(0, 100) : undefined;

  const where = {
    ...(status && { status }),
    ...(safeSearch && {
      OR: [
        { fullName: { contains: safeSearch, mode: 'insensitive' } },
        { phone: { contains: safeSearch } },
        { nic: { contains: safeSearch, mode: 'insensitive' } },
        { email: { contains: safeSearch, mode: 'insensitive' } },
      ],
    }),
  };

  const [total, members] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
  ]);

  return { total, page: safePage, limit: safeLimit, members };
};

const getMemberById = async (id) => {
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      payments: {
        orderBy: { paidDate: 'desc' },
        take: 12,
        include: { collectedBy: { select: { name: true } } },
      },
    },
  });
  if (!member) throw createError(404, 'Member not found.');
  return member;
};

const createMember = async (data) => {
  const dueDate = data.dueDate ? new Date(data.dueDate) : buildDueDate();

  const member = await prisma.member.create({
    data: {
      fullName: data.fullName,
      nic: data.nic || null,
      email: data.email || null,
      phone: data.phone,
      birthday: data.birthday ? new Date(data.birthday) : null,
      medicalNotes: data.medicalNotes || null,
      emergencyContact: data.emergencyContact || null,
      joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
      dueDate,
      status: 'ACTIVE',
    },
  });

  // Fire-and-forget welcome email
  if (member.email) {
    emailService.sendWelcomeEmail({
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      dueDate: member.dueDate,
    }).catch((err) => logger.warn(`[Email] Welcome email failed for ${member.fullName}: ${err.message}`));
  }

  return member;
};

const updateMember = async (id, data) => {
  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) throw createError(404, 'Member not found.');

  return prisma.member.update({
    where: { id },
    data: {
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.nic !== undefined && { nic: data.nic }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.birthday !== undefined && { birthday: data.birthday ? new Date(data.birthday) : null }),
      ...(data.medicalNotes !== undefined && { medicalNotes: data.medicalNotes }),
      ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
      ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
};

const deleteMember = async (id) => {
  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) throw createError(404, 'Member not found.');
  // Hard delete — payments are preserved (memberId set to null), reminder logs are cascade deleted
  return prisma.member.delete({ where: { id } });
};

module.exports = { listMembers, getMemberById, createMember, updateMember, deleteMember };
