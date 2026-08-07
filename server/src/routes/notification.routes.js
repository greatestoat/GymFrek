const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notification.controller');

const router = express.Router();

// No requireAdmin here - these are the caller's own notifications
// (scoped by req.userId in every query), owners and admins alike.
router.use(requireAuth);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

module.exports = router;