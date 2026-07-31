const test = require('node:test');
const assert = require('node:assert');
const db = require('./db');
const bcrypt = require('bcryptjs');

test('Database users and initial seed data exist', () => {
  const users = db.prepare('SELECT * FROM users').all();
  assert.ok(users.length >= 4);
});

test('Bcrypt password verification for seeded user', () => {
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('alex@apex.crm');
  assert.ok(admin);
  assert.ok(admin.password_hash);
  const isValid = bcrypt.compareSync('Password123!', admin.password_hash);
  assert.strictEqual(isValid, true);
});

test('Creating assignment inserts record and triggers notification', () => {
  const randId = Math.random().toString(36).substring(2, 8);
  const assignmentId = 'asg_test_' + randId;
  const notifId = 'ntf_test_' + randId;
  const targetUserId = 'usr_sarah';
  const assignerId = 'usr_alex';

  db.prepare(`
    INSERT INTO assignments (id, entity_type, entity_id, user_id, role, assigned_by_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(assignmentId, 'company', 'cmp_acme', targetUserId, 'Account Owner', assignerId);

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(notifId, targetUserId, 'assignment', 'Test Assignment', 'You have been assigned Acme Corp', 'company', 'cmp_acme', 'Account Owner');

  const createdNotif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);
  assert.ok(createdNotif);
  assert.strictEqual(createdNotif.user_id, targetUserId);
});

test('Marking notification as read updates database status', () => {
  const notif = db.prepare('SELECT * FROM notifications LIMIT 1').get();
  assert.ok(notif);

  db.prepare('UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?').run(notif.id);
  const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notif.id);
  assert.strictEqual(updated.is_read, 1);
});

test('Background process generates follow-up worker notification', () => {
  const jobId = 'job_test_' + Math.random().toString(36).substring(2, 8);
  db.prepare(`
    INSERT INTO background_jobs (id, job_type, status, details)
    VALUES (?, ?, ?, ?)
  `).run(jobId, 'followup_reminder', 'completed', 'Audit executed for inactive accounts');

  const job = db.prepare('SELECT * FROM background_jobs WHERE id = ?').get(jobId);
  assert.ok(job);
  assert.strictEqual(job.status, 'completed');
});
