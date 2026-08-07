const { validationResult } = require('express-validator');

// Wraps an array of express-validator chains. Runs them, then short-circuits
// with a 422 + field-level errors if any failed - keeps this logic out of
// every controller and gives the frontend a consistent error shape.
function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const result = validationResult(req);
      if (result.isEmpty()) return next();
      const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
      res.status(422).json({ message: 'Validation failed.', errors });
    },
  ];
}

module.exports = validate;
