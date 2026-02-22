const { asyncHandler, createError } = require('../middleware/errorHandler');
const authService = require('../services/auth.service');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// A password is strong enough if it has ≥8 chars, at least 1 uppercase, and 1 digit.
const isStrongPassword = (pw) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const login = [
  ...loginValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
      const data = await authService.login(email, password);
      res.json({ success: true, ...data });
    } catch (err) {
      if (err.statusCode === 401) {
        logger.warn(`[Security] Failed login attempt for "${email}" from ${req.ip}`);
      }
      throw err;
    }
  }),
];

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw createError(400, 'currentPassword and newPassword are required.');
  }
  if (!isStrongPassword(newPassword)) {
    throw createError(400, 'New password must be at least 8 characters and contain an uppercase letter and a number.');
  }
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json({ success: true, message: 'Password changed successfully.' });
});

const createStaffValidation = [
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('name is required and must be at most 100 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('role').optional().isIn(['OWNER', 'TRAINER']).withMessage('role must be OWNER or TRAINER.'),
];

const createStaff = [
  ...createStaffValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const user = await authService.createStaffUser({ name, email, password, role });
    res.status(201).json({ success: true, user });
  }),
];

const getStaff = asyncHandler(async (req, res) => {
  const staff = await authService.getStaffList();
  res.json({ success: true, staff });
});

const deactivateStaff = asyncHandler(async (req, res) => {
  await authService.deactivateStaff(req.params.id, req.user.id);
  res.json({ success: true, message: 'Staff account deactivated.' });
});

module.exports = { login, me, changePassword, createStaff, getStaff, deactivateStaff };
