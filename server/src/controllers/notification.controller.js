const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

function publicNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    ticketId: row.ticket_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

// GET /api/notifications
// Most-recent-first, capped at 50 - this backs both the navbar dropdown
// preview and the full /notifications page, so no separate "preview"
// endpoint is needed.
const listNotifications = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.userId]
  );
  res.json({ notifications: rows.map(publicNotification) });
});

// GET /api/notifications/unread-count
// Cheap, dedicated endpoint so the navbar can poll for the badge count
// without pulling the full notification list every time.
const getUnreadCount = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [req.userId]
  );
  res.json({ count: rows[0].count });
});

// PATCH /api/notifications/:id/read
const markNotificationRead = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
    [req.params.id, req.userId]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Notification not found.' });
  res.json({ notification: publicNotification(rows[0]) });
});

// PATCH /api/notifications/read-all
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
    [req.userId]
  );
  res.json({ message: 'All notifications marked as read.' });
});

module.exports = {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};