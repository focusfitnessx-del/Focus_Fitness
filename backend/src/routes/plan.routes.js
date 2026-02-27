const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, authorize, validateId } = require('../middleware/auth.middleware');
const planController = require('../controllers/plan.controller');

router.use(authenticate);

router.get('/', validateId(), planController.getPlans);
router.post('/', validateId(), authorize('OWNER'), planController.sendPlan);

module.exports = router;
