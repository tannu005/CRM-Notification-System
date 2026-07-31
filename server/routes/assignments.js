const express = require('express');
const router = express.Router();
const db = require('../db');

function createAssignmentRoutes(io) {
  router.get('/', (req, res) => {
    const assignments = db.prepare(`
      SELECT a.*, 
        u.name as user_name, u.avatar as user_avatar,
        ab.name as assigned_by_name
      FROM assignments a
      JOIN users u ON a.user_id = u.id
      JOIN users ab ON a.assigned_by_id = ab.id
      ORDER BY a.created_at DESC
    `).all();
    res.json(assignments);
  });

  router.post('/', (req, res) => {
    const { entity_type, entity_id, user_id, role, assigned_by_id } = req.body;

    if (!entity_type || !entity_id || !user_id || !role || !assigned_by_id) {
      return res.status(400).json({ error: 'Missing required assignment parameters' });
    }

    let entityName = '';
    if (entity_type === 'company') {
      const comp = db.prepare('SELECT name FROM companies WHERE id = ?').get(entity_id);
      if (!comp) return res.status(404).json({ error: 'Company not found' });
      entityName = comp.name;
    } else if (entity_type === 'contact') {
      const cnt = db.prepare('SELECT name FROM contacts WHERE id = ?').get(entity_id);
      if (!cnt) return res.status(404).json({ error: 'Contact not found' });
      entityName = cnt.name;
    } else {
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    const assignedBy = db.prepare('SELECT name FROM users WHERE id = ?').get(assigned_by_id);
    const assignerName = assignedBy ? assignedBy.name : 'System Admin';

    db.prepare('DELETE FROM assignments WHERE entity_type = ? AND entity_id = ? AND user_id = ?')
      .run(entity_type, entity_id, user_id);

    const assignmentId = 'asg_' + Math.random().toString(36).substring(2, 10);
    db.prepare('INSERT INTO assignments (id, entity_type, entity_id, user_id, role, assigned_by_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(assignmentId, entity_type, entity_id, user_id, role, assigned_by_id);

    const notifId = 'ntf_' + Math.random().toString(36).substring(2, 10);
    const title = `New ${entity_type === 'company' ? 'Company' : 'Contact'} Assignment`;
    const message = `You have been assigned to ${entityName} as ${role} by ${assignerName}.`;

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, role, is_read)
      VALUES (?, ?, 'assignment', ?, ?, ?, ?, ?, 0)
    `).run(notifId, user_id, title, message, entity_type, entity_id, role);

    const notificationPayload = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);

    if (io) {
      io.to(`user:${user_id}`).emit('notification:new', notificationPayload);
    }

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment_id: assignmentId,
      notification: notificationPayload
    });
  });

  return router;
}

module.exports = createAssignmentRoutes;
