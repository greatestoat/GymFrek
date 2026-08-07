const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const { createTicketRules } = require('../middleware/ticket.validators');
const { createTicket, getMyTickets } = require('../controllers/ticket.controller');

const router = express.Router();

router.post('/', requireAuth, createTicketRules, createTicket);
router.get('/mine', requireAuth, getMyTickets);

module.exports = router;