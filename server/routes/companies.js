const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const companies = db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();

  const assignmentsStmt = db.prepare(`
    SELECT a.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
    FROM assignments a
    JOIN users u ON a.user_id = u.id
    WHERE a.entity_type = 'company' AND a.entity_id = ?
  `);

  const contactsStmt = db.prepare('SELECT * FROM contacts WHERE company_id = ?');

  const result = companies.map(comp => {
    return {
      ...comp,
      assignments: assignmentsStmt.all(comp.id),
      contacts: contactsStmt.all(comp.id)
    };
  });

  res.json(result);
});

router.post('/', (req, res) => {
  const { name, industry, domain, status } = req.body;
  if (!name || !industry || !domain) {
    return res.status(400).json({ error: 'Name, industry, and domain are required' });
  }

  const id = 'cmp_' + Math.random().toString(36).substring(2, 10);
  const companyStatus = status || 'prospect';

  db.prepare('INSERT INTO companies (id, name, industry, domain, status) VALUES (?, ?, ?, ?, ?)').run(id, name, industry, domain, companyStatus);
  const newCompany = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);

  res.status(201).json({ ...newCompany, assignments: [], contacts: [] });
});

module.exports = router;
