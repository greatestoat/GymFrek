// const express = require('express');
// const requireAuth = require('../middleware/auth.middleware');
// const requireAdmin = require('../middleware/admin.middleware');
// const { setStatusRules, setPasswordRules } = require('../middleware/admin.validators');
// const {
//   getOverview, listGyms, getGymDetail, setOwnerStatus, setOwnerPassword,
// } = require('../controllers/admin.controller');

// const router = express.Router();

// router.use(requireAuth, requireAdmin);

// router.get('/overview', getOverview);
// router.get('/gyms', listGyms);
// router.get('/gyms/:gymId', getGymDetail);
// router.patch('/owners/:ownerId/status', setStatusRules, setOwnerStatus);
// router.patch('/owners/:ownerId/password', setPasswordRules, setOwnerPassword);

// module.exports = router;
const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');
const { setStatusRules, setPasswordRules } = require('../middleware/admin.validators');
const {
  getOverview, listGyms, getGymDetail, setOwnerStatus, setOwnerPassword, listPersonalTraining,
} = require('../controllers/admin.controller');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/overview', getOverview);
router.get('/gyms', listGyms);
router.get('/gyms/:gymId', getGymDetail);
router.get('/personal-training', listPersonalTraining);
router.patch('/owners/:ownerId/status', setStatusRules, setOwnerStatus);
router.patch('/owners/:ownerId/password', setPasswordRules, setOwnerPassword);

module.exports = router;