const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT u.*, 
      (SELECT COUNT(*) FROM notifications n WHERE n.user_id = u.id AND n.is_read = 0) as unread_count
    FROM users u
    ORDER BY u.name ASC
  `).all();
  res.json(users);
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.params.id).count;
  const assignments = db.prepare(`
    SELECT a.*, 
      CASE 
        WHEN a.entity_type = 'company' THEN (SELECT name FROM companies WHERE id = a.entity_id)
        WHEN a.entity_type = 'contact' THEN (SELECT name FROM contacts WHERE id = a.entity_id)
      END as entity_name,
      u.name as assigned_by_name
    FROM assignments a
    LEFT JOIN users u ON a.assigned_by_id = u.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.id);

  res.json({
    ...user,
    unread_count: unreadCount,
    assignments
  });
});

module.exports = router;
