const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const contacts = db.prepare(`
    SELECT c.*, comp.name as company_name 
    FROM contacts c
    LEFT JOIN companies comp ON c.company_id = comp.id
    ORDER BY c.created_at DESC
  `).all();

  const assignmentsStmt = db.prepare(`
    SELECT a.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
    FROM assignments a
    JOIN users u ON a.user_id = u.id
    WHERE a.entity_type = 'contact' AND a.entity_id = ?
  `);

  const result = contacts.map(contact => {
    return {
      ...contact,
      assignments: assignmentsStmt.all(contact.id)
    };
  });

  res.json(result);
});

router.post('/', (req, res) => {
  const { name, email, phone, title, company_id } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const id = 'cnt_' + Math.random().toString(36).substring(2, 10);
  db.prepare('INSERT INTO contacts (id, name, email, phone, title, company_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, email, phone || '', title || 'Contact', company_id || null);

  const newContact = db.prepare(`
    SELECT c.*, comp.name as company_name 
    FROM contacts c
    LEFT JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = ?
  `).get(id);

  res.status(201).json({ ...newContact, assignments: [] });
});

module.exports = router;
