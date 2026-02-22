const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', paymentController.list);
router.get('/monthly-revenue', paymentController.monthlyRevenue);
router.get('/:id', paymentController.getOne);
router.post('/', paymentController.record);

module.exports = router;
