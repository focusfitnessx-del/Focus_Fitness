const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
const { createError } = require('../middleware/errorHandler');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const login = async (email, password) => {
  if (!email || !password) {
    throw createError(400, 'Email and password are required.');
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive) {
    throw createError(401, 'Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError(401, 'Invalid email or password.');
  }

  const token = signToken(user);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError(404, 'User not found.');

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw createError(400, 'Current password is incorrect.');

  if (newPassword.length < 8) throw createError(400, 'New password must be at least 8 characters.');

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
};

const createStaffUser = async ({ name, email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw createError(409, 'A user with this email already exists.');

  if (password.length < 8) throw createError(400, 'Password must be at least 8 characters.');

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase().trim(), password: hashed, role: role || 'TRAINER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return user;
};

const getStaffList = async () => {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
};

const deactivateStaff = async (userId, requesterId) => {
  if (userId === requesterId) throw createError(400, 'You cannot deactivate your own account.');
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
};

module.exports = { login, changePassword, createStaffUser, getStaffList, deactivateStaff };
