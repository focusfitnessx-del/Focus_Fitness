const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/logs', reminderController.list);
router.post('/trigger/payment', authorize('OWNER'), reminderController.triggerPaymentReminders);
router.post('/trigger/birthday', authorize('OWNER'), reminderController.triggerBirthdayWishes);
router.post('/trigger/auto-expire', authorize('OWNER'), reminderController.triggerAutoExpire);

module.exports = router;
