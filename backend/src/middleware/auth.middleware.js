const jwt = require('jsonwebtoken');
const { createError } = require('./errorHandler');
const prisma = require('../utils/prismaClient');

/**
 * Verifies the JWT token and attaches the authenticated user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(401, 'Authentication required. Please provide a valid token.'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, isActive: true },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return next(createError(401, 'Token is no longer valid. Please log in again.'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token.'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired. Please log in again.'));
    }
    next(err);
  }
};

/**
 * Restricts access to specified roles.
 * Usage: authorize('OWNER') or authorize('OWNER', 'TRAINER')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(createError(403, 'You do not have permission to perform this action.'));
  }
  next();
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates that a route param is a well-formed UUID to prevent malformed DB queries.
 * Usage: router.get('/:id', validateId(), handler)
 */
const validateId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || !UUID_REGEX.test(id)) {
    return next(createError(400, 'Invalid identifier.'));
  }
  next();
};

/**
 * Protects the hardware device entry endpoint with a shared API key.
 * Requires X-Device-Key header matching DEVICE_API_KEY env var.
 */
const deviceKeyAuth = (req, res, next) => {
  const deviceKey = req.headers['x-device-key'];
  if (!process.env.DEVICE_API_KEY || !deviceKey || deviceKey !== process.env.DEVICE_API_KEY) {
    return next(createError(401, 'Valid device key required.'));
  }
  next();
};

module.exports = { authenticate, authorize, validateId, deviceKeyAuth };
