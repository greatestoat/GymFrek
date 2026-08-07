const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const { requireGym } = require('../middleware/tenant.middleware');
const { getDues } = require('../controllers/dues.controller');

const router = express.Router();

router.use(requireAuth, requireGym);
router.get('/', getDues);

module.exports = router;
