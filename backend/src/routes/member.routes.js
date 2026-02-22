const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', memberController.list);
router.get('/:id', memberController.getOne);
router.post('/', memberController.create);
router.patch('/:id', memberController.update);
router.delete('/:id', authorize('OWNER', 'TRAINER'), memberController.remove);

module.exports = router;
