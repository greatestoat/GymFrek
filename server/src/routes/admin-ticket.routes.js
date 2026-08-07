// const express = require('express');
// const requireAuth = require('../middleware/auth.middleware');
// const requireAdmin = require('../middleware/admin.middleware');
// const { updateTicketStatusRules } = require('../middleware/ticket.validators');
// const { listTickets, getTicket, updateTicketStatus } = require('../controllers/ticket.controller');

// const router = express.Router();

// // Every route below requires a valid session AND the platform admin role.
// router.use(requireAuth, requireAdmin);

// router.get('/', listTickets);
// router.get('/:id', getTicket);
// router.patch('/:id/status', updateTicketStatusRules, updateTicketStatus);

// module.exports = router;
const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const requireAdmin = require('../middleware/admin.middleware');
const { updateTicketStatusRules, replyTicketRules } = require('../middleware/ticket.validators');
const { listTickets, getTicket, updateTicketStatus, replyToTicket } = require('../controllers/ticket.controller');

const router = express.Router();

// Every route below requires a valid session AND the platform admin role.
router.use(requireAuth, requireAdmin);

router.get('/', listTickets);
router.get('/:id', getTicket);
router.patch('/:id/status', updateTicketStatusRules, updateTicketStatus);
router.patch('/:id/reply', replyTicketRules, replyToTicket);

module.exports = router;