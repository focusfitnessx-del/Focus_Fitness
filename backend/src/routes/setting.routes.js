const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', settingController.getAll);
router.patch('/bulk', authorize('OWNER'), settingController.updateBulk);
router.patch('/', authorize('OWNER'), settingController.update);
router.post('/email-test', authorize('OWNER'), settingController.sendTestEmail);

module.exports = router;
