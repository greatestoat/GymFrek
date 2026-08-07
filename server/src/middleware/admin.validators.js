const { body } = require('express-validator');
const validate = require('./validate');

const setStatusRules = validate([
  body('isActive').isBoolean().withMessage('isActive must be true or false.').toBoolean(),
]);

const setPasswordRules = validate([
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8-72 characters.'),
]);

module.exports = { setStatusRules, setPasswordRules };
