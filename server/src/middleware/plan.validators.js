// const { body } = require('express-validator');
// const validate = require('./validate');

// const baseRules = (optional) => {
//   const wrap = (chain) => (optional ? chain.optional() : chain);
//   return [
//     wrap(body('name').trim().isLength({ min: 2, max: 150 })).withMessage('Plan name must be 2-150 characters.'),
//     body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
//     wrap(body('durationMonths').isIn([1, 3, 6, 12]).toInt()).withMessage('Duration must be 1, 3, 6, or 12 months.'),
//     wrap(body('price').isFloat({ min: 0 })).withMessage('Price must be a positive number.'),
//     body('discount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Discount must be a positive number.'),
//     body('features').optional({ nullable: true }).isArray().withMessage('Features must be a list.'),
//     body('isActive').optional({ nullable: true }).isBoolean().toBoolean(),
//   ];
// };

// const createPlanRules = validate(baseRules(false));
// const updatePlanRules = validate(baseRules(true));

// const assignPlanRules = validate([
//   body('memberId').isUUID().withMessage('A valid member is required.'),
//   body('planId').isUUID().withMessage('A valid plan is required.'),
//   body('startDate').optional({ nullable: true }).isISO8601(),
//   body('pricePaid').optional({ nullable: true }).isFloat({ min: 0 }),
// ]);

// module.exports = { createPlanRules, updatePlanRules, assignPlanRules };
const { body } = require('express-validator');
const validate = require('./validate');

const PLAN_TYPES = ['membership', 'personal_training'];

const baseRules = (optional) => {
  const wrap = (chain) => (optional ? chain.optional() : chain);
  return [
    wrap(body('name').trim().isLength({ min: 2, max: 150 })).withMessage('Plan name must be 2-150 characters.'),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
    body('planType').optional({ nullable: true }).isIn(PLAN_TYPES).withMessage('Invalid plan type.'),
    wrap(body('durationMonths').isIn([1, 3, 6, 12]).toInt()).withMessage('Duration must be 1, 3, 6, or 12 months.'),
    wrap(body('price').isFloat({ min: 0 })).withMessage('Price must be a positive number.'),
    body('discount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Discount must be a positive number.'),
    body('features').optional({ nullable: true }).isArray().withMessage('Features must be a list.'),
    body('isActive').optional({ nullable: true }).isBoolean().toBoolean(),
  ];
};

const createPlanRules = validate(baseRules(false));
const updatePlanRules = validate(baseRules(true));

const assignPlanRules = validate([
  body('memberId').isUUID().withMessage('A valid member is required.'),
  body('planId').isUUID().withMessage('A valid plan is required.'),
  body('startDate').optional({ nullable: true }).isISO8601(),
  body('pricePaid').optional({ nullable: true }).isFloat({ min: 0 }),
  body('trainerName').optional({ nullable: true }).trim().isLength({ min: 2, max: 100 }).withMessage('Enter a valid trainer name.'),
  body('trainerMobile').optional({ nullable: true }).trim().matches(/^[0-9+\-\s]{7,20}$/).withMessage('Enter a valid trainer mobile number.'),
  body('trainerFee').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Trainer fee must be a positive number.'),
  body('trainerNotes').optional({ nullable: true }).trim().isLength({ max: 500 }),
]);

module.exports = { createPlanRules, updatePlanRules, assignPlanRules };