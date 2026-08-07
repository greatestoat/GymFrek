const { body } = require('express-validator');
const validate = require('./validate');

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM 24h

const baseRules = (optional) => {
  const wrap = (chain) => (optional ? chain.optional() : chain);
  return [
    wrap(body('name').trim().isLength({ min: 2, max: 150 })).withMessage('Gym name must be 2-150 characters.'),
    wrap(body('ownerName').trim().isLength({ min: 2, max: 100 })).withMessage('Owner name must be 2-100 characters.'),
    wrap(body('mobile').trim().matches(/^[0-9+\-\s]{7,20}$/)).withMessage('Enter a valid mobile number.'),
    wrap(body('email').trim().isEmail()).withMessage('Enter a valid email.').normalizeEmail(),
    wrap(body('address').trim().isLength({ min: 5, max: 500 })).withMessage('Address must be 5-500 characters.'),
    wrap(body('city').trim().isLength({ min: 2, max: 100 })).withMessage('City must be 2-100 characters.'),
    wrap(body('state').trim().isLength({ min: 2, max: 100 })).withMessage('State must be 2-100 characters.'),
    wrap(body('pincode').trim().matches(/^[0-9A-Za-z\- ]{3,12}$/)).withMessage('Enter a valid pincode.'),
    wrap(body('openingTime').matches(TIME_RE)).withMessage('Opening time must be HH:MM.'),
    wrap(body('closingTime').matches(TIME_RE)).withMessage('Closing time must be HH:MM.'),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }).withMessage('Description too long.'),
  ];
};

const registerGymRules = validate(baseRules(false));
const updateGymRules = validate(baseRules(true));

module.exports = { registerGymRules, updateGymRules };
