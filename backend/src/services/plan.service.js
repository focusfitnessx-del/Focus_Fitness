const prisma = require('../utils/prismaClient');
const { sendPlanEmail } = require('./email.service');
const logger = require('../utils/logger');

const getPlans = async (memberId) => {
  const [mealPlan, workout] = await Promise.all([
    prisma.memberPlan.findFirst({
      where: { memberId, type: 'MEAL_PLAN' },
      orderBy: { sentAt: 'desc' },
    }),
    prisma.memberPlan.findFirst({
      where: { memberId, type: 'WORKOUT' },
      orderBy: { sentAt: 'desc' },
    }),
  ]);
  return { mealPlan, workout };
};

const sendPlan = async ({ memberId, type, title, content, sentById }) => {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, fullName: true, email: true },
  });

  if (!member) throw Object.assign(new Error('Member not found.'), { statusCode: 404 });

  // Replace existing plan of same type (delete old one)
  await prisma.memberPlan.deleteMany({ where: { memberId, type } });

  // Save new plan
  const plan = await prisma.memberPlan.create({
    data: { memberId, type, title: title || null, content, sentById: sentById || null },
  });

  // Send email if member has email
  if (member.email) {
    await sendPlanEmail({ name: member.fullName, email: member.email, type, title, content });
    logger.info(`[Plans] ${type} sent to ${member.fullName} (${member.email})`);
  } else {
    logger.warn(`[Plans] ${type} saved but member ${member.fullName} has no email — skipping send`);
  }

  return plan;
};

module.exports = { getPlans, sendPlan };
