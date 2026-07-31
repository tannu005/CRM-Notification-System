const express = require('express');
const router = express.Router();
const db = require('../db');

function createNotificationRoutes(io) {
  router.get('/', (req, res) => {
    const { userId, unreadOnly } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter is required' });
    }

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC';

    const notifications = db.prepare(query).all(...params);
    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(userId).count;

    res.json({ notifications, unread_count: unreadCount });
  });

  router.put('/:id/read', (req, res) => {
    const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    db.prepare('UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);

    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(notif.user_id).count;

    if (io) {
      io.to(`user:${notif.user_id}`).emit('notification:updated', { notification: updated, unread_count: unreadCount });
    }

    res.json({ notification: updated, unread_count: unreadCount });
  });

  router.put('/read-all', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    db.prepare('UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0').run(userId);

    if (io) {
      io.to(`user:${userId}`).emit('notification:read-all', { userId, unread_count: 0 });
    }

    res.json({ success: true, unread_count: 0 });
  });

  return router;
}

module.exports = createNotificationRoutes;
