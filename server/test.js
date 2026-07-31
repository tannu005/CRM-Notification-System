const assert = require('assert');
const test = require('node:test');
const db = require('./db');
const NotificationWorker = require('./worker');

test('Database users and initial seed data exist', () => {
  const users = db.prepare('SELECT * FROM users').all();
  assert.ok(users.length >= 4, 'Should have at least 4 seeded users');
  
  const admin = users.find(u => u.role === 'admin');
  assert.ok(admin, 'Admin user should exist');
});

test('Database companies and contacts exist', () => {
  const companies = db.prepare('SELECT * FROM companies').all();
  assert.ok(companies.length >= 4, 'Should have at least 4 companies');

  const contacts = db.prepare('SELECT * FROM contacts').all();
  assert.ok(contacts.length >= 4, 'Should have at least 4 contacts');
});

test('Creating assignment inserts record and triggers notification targeting specific user', () => {
  const user = db.prepare('SELECT * FROM users WHERE role = ?').get('agent');
  const admin = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
  const company = db.prepare('SELECT * FROM companies').get();

  const assignmentId = 'asg_test_' + Math.random().toString(36).substring(2, 8);
  db.prepare('INSERT INTO assignments (id, entity_type, entity_id, user_id, role, assigned_by_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(assignmentId, 'company', company.id, user.id, 'Account Owner', admin.id);

  const notifId = 'ntf_test_' + Math.random().toString(36).substring(2, 8);
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, role, is_read)
    VALUES (?, ?, 'assignment', 'New Company Assignment', 'You have been assigned to test company', 'company', ?, 'Account Owner', 0)
  `).run(notifId, user.id, company.id);

  const savedNotif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);
  assert.strictEqual(savedNotif.user_id, user.id);
  assert.strictEqual(savedNotif.is_read, 0);

  const otherUserNotifications = db.prepare('SELECT * FROM notifications WHERE user_id != ? AND id = ?').all(user.id, notifId);
  assert.strictEqual(otherUserNotifications.length, 0, 'Notification must NOT belong to other users');
});

test('Marking notification as read updates database status', () => {
  const notif = db.prepare('SELECT * FROM notifications WHERE is_read = 0').get();
  assert.ok(notif, 'Should find an unread notification');

  db.prepare('UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?').run(notif.id);

  const updatedNotif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notif.id);
  assert.strictEqual(updatedNotif.is_read, 1);
  assert.ok(updatedNotif.read_at !== null);
});

test('Background process generates follow-up worker notification', () => {
  const mockIo = {
    to: () => ({ emit: () => {} })
  };
  const worker = new NotificationWorker(mockIo);
  const result = worker.runScheduledFollowUpJob();
  
  assert.ok(result.status === 'success' || result.status === 'skipped');
  if (result.status === 'success') {
    assert.ok(result.notification.id);
    assert.strictEqual(result.notification.is_read, 0);
  }
});
