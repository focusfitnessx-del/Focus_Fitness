const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entry.controller');
const { authenticate, validateId } = require('../middleware/auth.middleware');

router.get('/check/:memberId', authenticate, validateId('memberId'), entryController.checkEntry);

// Hardware device endpoint — no auth required (for physical access control devices)
router.get('/device/check/:memberId', validateId('memberId'), entryController.checkEntry);

module.exports = router;
