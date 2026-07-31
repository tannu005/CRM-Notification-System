const db = require('./db');

class NotificationWorker {
  constructor(io) {
    this.io = io;
    this.timer = null;
  }

  start(intervalMs = 30000) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.runScheduledFollowUpJob();
    }, intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  runScheduledFollowUpJob() {
    const jobId = 'job_' + Math.random().toString(36).substring(2, 10);
    const assignedUsers = db.prepare(`
      SELECT DISTINCT a.user_id, a.entity_type, a.entity_id, a.role, u.name as user_name,
        CASE 
          WHEN a.entity_type = 'company' THEN (SELECT name FROM companies WHERE id = a.entity_id)
          WHEN a.entity_type = 'contact' THEN (SELECT name FROM contacts WHERE id = a.entity_id)
        END as entity_name
      FROM assignments a
      JOIN users u ON a.user_id = u.id
      ORDER BY RANDOM()
      LIMIT 1
    `).get();

    if (!assignedUsers) {
      db.prepare('INSERT INTO background_jobs (id, name, status, details) VALUES (?, ?, ?, ?)')
        .run(jobId, 'Scheduled Follow-Up Worker', 'skipped', 'No active assignments found for scheduled reminder.');
      return { status: 'skipped', message: 'No assignments found' };
    }

    const { user_id, entity_type, entity_name, role } = assignedUsers;
    const notifId = 'ntf_' + Math.random().toString(36).substring(2, 10);
    const title = 'Background Worker: Follow-up Reminder';
    const message = `Automated check-in: Remember to review ${entity_type} "${entity_name}" (Role: ${role}).`;

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, role, is_read)
      VALUES (?, ?, 'reminder', ?, ?, ?, ?, ?, 0)
    `).run(notifId, user_id, title, message, entity_type, assignedUsers.entity_id, role);

    const notificationPayload = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);

    if (this.io) {
      this.io.to(`user:${user_id}`).emit('notification:new', notificationPayload);
    }

    const details = `Generated automated reminder notification ${notifId} for user ${user_id} regarding ${entity_name}.`;
    db.prepare('INSERT INTO background_jobs (id, name, status, details) VALUES (?, ?, ?, ?)')
      .run(jobId, 'Scheduled Follow-Up Worker', 'success', details);

    return {
      status: 'success',
      job_id: jobId,
      notification: notificationPayload
    };
  }

  triggerCustomJob(jobType, targetUserId) {
    const jobId = 'job_' + Math.random().toString(36).substring(2, 10);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);

    if (!user) {
      throw new Error('Target user not found');
    }

    let title = '';
    let message = '';

    if (jobType === 'weekly_digest') {
      title = 'Weekly CRM Activity Summary';
      message = `Background Service: You have pending high-priority leads needing contact this week.`;
    } else if (jobType === 'stale_lead') {
      title = 'Stale Lead Re-engagement Alert';
      message = `Background Worker: Acme Corp has been inactive for 7 days. Time to send a follow-up email.`;
    } else {
      title = 'System Maintenance Notice';
      message = `Background Dispatcher: Automated database index re-alignment completed successfully.`;
    }

    const notifId = 'ntf_' + Math.random().toString(36).substring(2, 10);
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, is_read)
      VALUES (?, ?, 'reminder', ?, ?, 0)
    `).run(notifId, targetUserId, title, message);

    const notificationPayload = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);

    if (this.io) {
      this.io.to(`user:${targetUserId}`).emit('notification:new', notificationPayload);
    }

    db.prepare('INSERT INTO background_jobs (id, name, status, details) VALUES (?, ?, ?, ?)')
      .run(jobId, `Manual Worker: ${jobType}`, 'success', `Delivered notification to ${user.name}`);

    return {
      status: 'success',
      job_id: jobId,
      notification: notificationPayload
    };
  }

  getJobHistory() {
    return db.prepare('SELECT * FROM background_jobs ORDER BY created_at DESC LIMIT 20').all();
  }
}

module.exports = NotificationWorker;
