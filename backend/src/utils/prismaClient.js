const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => logger.error('Prisma error: ' + e.message));
prisma.$on('warn', (e) => logger.warn('Prisma warning: ' + e.message));

module.exports = prisma;
