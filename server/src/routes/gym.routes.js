const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const { attachGym, requireGym } = require('../middleware/tenant.middleware');
const { registerGymRules, updateGymRules } = require('../middleware/gym.validators');
const { uploadGymLogo } = require('../utils/upload');
const { getMyGym, registerGym, updateGym, uploadLogo } = require('../controllers/gym.controller');

const router = express.Router();

router.use(requireAuth);

// Does NOT require an existing gym - this is how the client checks whether
// to show the registration wizard or redirect to the dashboard.
router.get('/me', attachGym, getMyGym);

router.post('/', registerGymRules, registerGym);

// Everything below requires the caller to already own a gym.
router.patch('/', requireGym, updateGymRules, updateGym);
router.post('/logo', requireGym, uploadGymLogo.single('logo'), uploadLogo);

module.exports = router;
