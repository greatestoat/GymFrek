const { body } = require('express-validator');
const validate = require('./validate');

const STATUSES = ['Active', 'Expired', 'Paused'];
const GENDERS = ['Male', 'Female', 'Other'];

const baseRules = (optional) => {
  const wrap = (chain) => (optional ? chain.optional() : chain);
  return [
    wrap(body('fullName').trim().isLength({ min: 2, max: 150 })).withMessage('Full name must be 2-150 characters.'),
    wrap(body('mobile').trim().matches(/^[0-9+\-\s]{7,20}$/)).withMessage('Enter a valid mobile number.'),
    body('email').optional({ nullable: true }).trim().isEmail().withMessage('Enter a valid email.').normalizeEmail(),
    body('gender').optional({ nullable: true }).isIn(GENDERS).withMessage('Invalid gender.'),
    body('dateOfBirth').optional({ nullable: true }).isISO8601().withMessage('Invalid date of birth.'),
    body('address').optional({ nullable: true }).trim().isLength({ max: 500 }),
    body('emergencyContact').optional({ nullable: true }).trim().matches(/^[0-9+\-\s]{7,20}$/).withMessage('Enter a valid emergency contact.'),
    body('heightCm').optional({ nullable: true }).isFloat({ min: 0, max: 300 }).withMessage('Invalid height.'),
    body('weightKg').optional({ nullable: true }).isFloat({ min: 0, max: 500 }).withMessage('Invalid weight.'),
    body('medicalNotes').optional({ nullable: true }).trim().isLength({ max: 1000 }),
    body('joinDate').optional({ nullable: true }).isISO8601().withMessage('Invalid join date.'),
    body('membershipStatus').optional({ nullable: true }).isIn(STATUSES).withMessage('Invalid membership status.'),
  ];
};

const createMemberRules = validate(baseRules(false));
const updateMemberRules = validate(baseRules(true));

module.exports = { createMemberRules, updateMemberRules };
