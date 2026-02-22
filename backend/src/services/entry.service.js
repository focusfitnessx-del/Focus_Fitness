const prisma = require('../utils/prismaClient');
const { createError } = require('../middleware/errorHandler');

/**
 * Entry Control Service
 *
 * Placeholder for future fingerprint/face recognition integration.
 * Currently evaluates membership status from the database.
 *
 * Future integration point:
 *   - Replace checkMemberEntry() with biometric device callback
 *   - Device sends memberId (or biometric hash) → this service validates
 *   - Response signals access control hardware: ALLOW / DENY
 */

const EntryResult = {
  ALLOWED: 'ALLOWED',
  DENIED: 'DENIED',
};

/**
 * Check whether a member is allowed to enter the gym.
 * @param {string} memberId
 * @returns {{ allowed: boolean, result: string, member: object, reason: string }}
 */
const checkMemberEntry = async (memberId) => {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      status: true,
      dueDate: true,
    },
  });

  if (!member) {
    return {
      allowed: false,
      result: EntryResult.DENIED,
      reason: 'Member not found.',
      member: null,
    };
  }

  if (member.status === 'ACTIVE') {
    return {
      allowed: true,
      result: EntryResult.ALLOWED,
      reason: 'Membership is active.',
      member,
    };
  }

  return {
    allowed: false,
    result: EntryResult.DENIED,
    reason: 'Membership is expired. Please renew your membership.',
    member,
  };
};

module.exports = { checkMemberEntry, EntryResult };
