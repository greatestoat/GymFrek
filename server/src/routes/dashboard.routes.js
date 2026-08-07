const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const { requireGym } = require('../middleware/tenant.middleware');
const { getSummary } = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(requireAuth, requireGym);
router.get('/summary', getSummary);

module.exports = router;
