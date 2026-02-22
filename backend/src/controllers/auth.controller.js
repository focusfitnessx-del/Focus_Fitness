const { asyncHandler, createError } = require('../middleware/errorHandler');
const authService = require('../services/auth.service');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const login = [
  ...loginValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.json({ success: true, ...data });
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
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json({ success: true, message: 'Password changed successfully.' });
});

const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw createError(400, 'name, email, and password are required.');
  const user = await authService.createStaffUser({ name, email, password, role });
  res.status(201).json({ success: true, user });
});

const getStaff = asyncHandler(async (req, res) => {
  const staff = await authService.getStaffList();
  res.json({ success: true, staff });
});

const deactivateStaff = asyncHandler(async (req, res) => {
  await authService.deactivateStaff(req.params.id, req.user.id);
  res.json({ success: true, message: 'Staff account deactivated.' });
});

module.exports = { login, me, changePassword, createStaff, getStaff, deactivateStaff };
