const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { authenticate, authorize, validateId } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', memberController.list);
router.get('/:id', validateId(), memberController.getOne);
router.post('/', memberController.create);
router.patch('/:id', validateId(), memberController.update);
router.delete('/:id', validateId(), authorize('OWNER', 'TRAINER'), memberController.remove);

module.exports = router;
