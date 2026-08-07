const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const { requireGym } = require('../middleware/tenant.middleware');
const { createPlanRules, updatePlanRules, assignPlanRules } = require('../middleware/plan.validators');
const {
  listPlans, getPlan, createPlan, updatePlan, deletePlan, assignPlan,
} = require('../controllers/plan.controller');

const router = express.Router();

router.use(requireAuth, requireGym);

router.get('/', listPlans);
router.post('/', createPlanRules, createPlan);
router.post('/assign', assignPlanRules, assignPlan);
router.get('/:id', getPlan);
router.patch('/:id', updatePlanRules, updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
