const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entry.controller');
const { authenticate, validateId, deviceKeyAuth } = require('../middleware/auth.middleware');

router.get('/check/:memberId', authenticate, validateId('memberId'), entryController.checkEntry);

// Hardware device endpoint — secured by X-Device-Key header (set DEVICE_API_KEY in .env)
router.get('/device/check/:memberId', deviceKeyAuth, validateId('memberId'), entryController.checkEntry);

module.exports = router;
