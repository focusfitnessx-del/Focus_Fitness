const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, authorize, validateId } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.patch('/change-password', authenticate, authController.changePassword);

// Staff management — OWNER only
router.get('/staff', authenticate, authorize('OWNER'), authController.getStaff);
router.post('/staff', authenticate, authorize('OWNER'), authController.createStaff);
router.delete('/staff/:id', authenticate, authorize('OWNER'), validateId(), authController.deactivateStaff);

module.exports = router;
