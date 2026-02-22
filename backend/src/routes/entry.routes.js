const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entry.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Entry check can be called by the hardware device (no auth) 
// or from the frontend (with auth). We use authenticate to protect the frontend endpoint.
router.get('/check/:memberId', authenticate, entryController.checkEntry);

// Unprotected endpoint for hardware device integration (future use)
// Secured by a device token in production - this is a placeholder
router.get('/device/check/:memberId', entryController.checkEntry);

module.exports = router;
