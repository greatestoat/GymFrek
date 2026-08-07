const { body } = require('express-validator');
const validate = require('./validate');

// Covers all three Support-page forms (contact/support, bug report, feature
// suggestion) - they all POST to the same endpoint with a `type` field, so
// one rule set validates the shared shape rather than three near-duplicates.
const createTicketRules = validate([
  body('type')
    .isIn(['support', 'bug', 'feature'])
    .withMessage('Invalid ticket type.'),
  body('message')
    .trim()
    .isLength({ min: 5, max: 5000 })
    .withMessage('Please provide a bit more detail (at least 5 characters).'),
  body('name').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body('gymName').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Enter a valid email.'),
  body('subject').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
]);

const updateTicketStatusRules = validate([
  body('status')
    .isIn(['open', 'in_progress', 'resolved'])
    .withMessage('Invalid status.'),
]);

const replyTicketRules = validate([
  body('reply')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Reply cannot be empty.'),
]);

module.exports = { createTicketRules, updateTicketStatusRules, replyTicketRules };