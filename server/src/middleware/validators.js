const { body, validationResult } = require('express-validator');

// Runs after the validation chains below; returns a clean 400 instead of
// letting bad input reach the controller/SQL layer at all.
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

const registerRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.')
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage('Name contains invalid characters.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password needs at least one uppercase letter.')
    .matches(/[a-z]/)
    .withMessage('Password needs at least one lowercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password needs at least one number.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const profileUpdateRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),
  body('goal')
    .optional()
    .trim()
    .isIn(['general_fitness', 'strength', 'weight_loss', 'endurance', 'mobility'])
    .withMessage('Invalid goal.'),
];

module.exports = { handleValidation, registerRules, loginRules, profileUpdateRules };
