const logger = require('../utils/logger');

/**
 * Centralized error handler middleware.
 * Catches all errors thrown via next(err) or unhandled throws inside async wrappers.
 */
const errorHandler = (err, req, res, next) => {
  // Prisma known errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join?.(', ') || 'value';
    return res.status(409).json({
      success: false,
      message: `A member with this ${field} already exists.`,
      field: err.meta?.target,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error(err.stack || message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * Wraps async route handlers to forward errors to the error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Creates an HTTP error with a status code.
 */
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, asyncHandler, createError };
