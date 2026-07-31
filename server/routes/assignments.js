const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { sendEmailFallback } = require('../services/emailService');

router.post('/', authenticateJWT, (req, res) => {
  const { entity_type, entity_id, user_id, role, assigned_by_id } = req.body;

  if (!entity_type || !entity_id || !user_id || !role) {
    return res.status(400).json({ error: 'Missing required assignment fields' });
  }

  const assignerId = assigned_by_id || req.user?.id || 'usr_alex';
  const assignmentId = 'asg_' + Math.random().toString(36).substring(2, 9);

  db.prepare(`
    INSERT INTO assignments (id, entity_type, entity_id, user_id, role, assigned_by_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(assignmentId, entity_type, entity_id, user_id, role, assignerId);

  let entityName = 'Entity';
  if (entity_type === 'company') {
    const comp = db.prepare('SELECT name FROM companies WHERE id = ?').get(entity_id);
    if (comp) entityName = comp.name;
  } else if (entity_type === 'contact') {
    const cont = db.prepare('SELECT name FROM contacts WHERE id = ?').get(entity_id);
    if (cont) entityName = cont.name;
  }

  const assigner = db.prepare('SELECT name FROM users WHERE id = ?').get(assignerId);
  const assignerName = assigner ? assigner.name : 'An Admin';

  const notificationId = 'ntf_' + Math.random().toString(36).substring(2, 9);
  const title = `New Assignment: ${entityName}`;
  const message = `You have been assigned to ${entityName} as ${role} by ${assignerName}.`;

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(notificationId, user_id, 'assignment', title, message, entity_type, entity_id, role);

  const io = req.app.get('io');
  if (io) {
    const payload = {
      id: notificationId,
      user_id,
      type: 'assignment',
      title,
      message,
      entity_type,
      entity_id,
      role,
      created_at: new Date().toISOString()
    };
    io.to(`user:${user_id}`).emit('notification', payload);
  }

  const targetUser = db.prepare('SELECT email FROM users WHERE id = ?').get(user_id);
  if (targetUser && targetUser.email) {
    sendEmailFallback({
      toEmail: targetUser.email,
      subject: title,
      body: message
    });
  }

  res.status(201).json({
    success: true,
    assignment: { id: assignmentId, entity_type, entity_id, user_id, role },
    notification: { id: notificationId, title, message }
  });
});

module.exports = router;
