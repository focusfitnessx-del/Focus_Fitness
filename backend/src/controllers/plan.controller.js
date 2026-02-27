const { asyncHandler, createError } = require('../middleware/errorHandler');
const planService = require('../services/plan.service');

const getPlans = asyncHandler(async (req, res) => {
  const plans = await planService.getPlans(req.params.id);
  res.json({ success: true, ...plans });
});

const sendPlan = asyncHandler(async (req, res) => {
  const { type, title, content } = req.body;

  if (!type || !['MEAL_PLAN', 'WORKOUT'].includes(type)) {
    return next(createError(400, 'type must be MEAL_PLAN or WORKOUT.'));
  }
  if (!content?.trim()) {
    throw createError(400, 'content is required.');
  }

  const plan = await planService.sendPlan({
    memberId: req.params.id,
    type,
    title: title?.trim() || null,
    content: content.trim(),
    sentById: req.user.id,
  });

  res.json({ success: true, message: 'Plan saved and email sent.', plan });
});

module.exports = { getPlans, sendPlan };
