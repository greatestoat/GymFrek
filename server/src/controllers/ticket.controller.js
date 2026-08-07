const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

function publicTicket(row) {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    name: row.name,
    gymName: row.gym_name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    adminReply: row.admin_reply || null,
    repliedAt: row.replied_at || null,
    gymMobile: row.gym_mobile || null,
    gymAddress: row.gym_address || null,
    gymCity: row.gym_city || null,
    gymState: row.gym_state || null,
    gymPincode: row.gym_pincode || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// POST /api/tickets
// Any authenticated user (gym owner) can submit - covers the Support,
// Bug Report, and Feature Suggestion forms, distinguished by `type`.
const createTicket = asyncHandler(async (req, res) => {
  const { type, name, gymName, email, subject, message } = req.body;

  const { rows } = await query(
    `INSERT INTO tickets (type, user_id, name, gym_name, email, subject, message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [type, req.userId, name || null, gymName || null, email || null, subject || null, message]
  );

  res.status(201).json({ ticket: publicTicket(rows[0]) });
});

// GET /api/tickets/mine
// The logged-in user's own tickets, so the Support page can show
// "your question -> our answer" as a thread. Only `support`-type tickets
// carry a back-and-forth in the UI, but we return all types here and let
// the client decide what to show - keeps this endpoint simple and reusable.
const getMyTickets = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  );
  res.json({ tickets: rows.map(publicTicket) });
});

// GET /api/admin/tickets?type=&status=
// Platform Super Admin only (gated by requireAdmin in the router).
const listTickets = asyncHandler(async (req, res) => {
  const { type, status } = req.query;
  const conditions = [];
  const params = [];

  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT t.*, g.mobile AS gym_mobile, g.address AS gym_address, g.city AS gym_city, g.state AS gym_state, g.pincode AS gym_pincode
     FROM tickets t
     LEFT JOIN gyms g ON t.user_id = g.owner_id
     ${where}
     ORDER BY t.created_at DESC`,
    params
  );

  res.json({ tickets: rows.map(publicTicket) });
});

// GET /api/admin/tickets/:id
const getTicket = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT t.*, g.mobile AS gym_mobile, g.address AS gym_address, g.city AS gym_city, g.state AS gym_state, g.pincode AS gym_pincode
     FROM tickets t
     LEFT JOIN gyms g ON t.user_id = g.owner_id
     WHERE t.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Ticket not found.' });
  res.json({ ticket: publicTicket(rows[0]) });
});

// PATCH /api/admin/tickets/:id/status
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { rows } = await query(
    'UPDATE tickets SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Ticket not found.' });
  res.json({ ticket: publicTicket(rows[0]) });
});

// PATCH /api/admin/tickets/:id/reply
// Posts (or edits) the admin's answer. Replying also resolves the ticket
// and, if the ticket has a linked user (submitted while logged in), drops
// a notification for them - this is what lights up the bell on their side.
const replyToTicket = asyncHandler(async (req, res) => {
  const { reply } = req.body;

  const { rows } = await query(
    `UPDATE tickets
     SET admin_reply = $1, replied_at = NOW(), status = 'resolved'
     WHERE id = $2
     RETURNING *`,
    [reply, req.params.id]
  );

  if (rows.length === 0) return res.status(404).json({ message: 'Ticket not found.' });

  const ticket = rows[0];

  if (ticket.user_id) {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, ticket_id)
       VALUES ($1, 'ticket_reply', $2, $3, $4)`,
      [
        ticket.user_id,
        `Your question was answered: ${ticket.subject || 'Support request'}`,
        reply.length > 140 ? `${reply.slice(0, 140)}…` : reply,
        ticket.id,
      ]
    );
  }

  res.json({ ticket: publicTicket(ticket) });
});

module.exports = {
  createTicket,
  getMyTickets,
  listTickets,
  getTicket,
  updateTicketStatus,
  replyToTicket,
};