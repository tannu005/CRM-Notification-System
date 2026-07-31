const db = require('./db');

class NotificationWorker {
  constructor(io) {
    this.io = io;
    this.timer = null;
  }

  start(intervalMs = 45000) {
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
    const assignedUser = db.prepare(`
      SELECT DISTINCT a.user_id, a.entity_type, a.entity_id, a.role, u.name as user_name
      FROM assignments a
      JOIN users u ON a.user_id = u.id
      ORDER BY RANDOM()
      LIMIT 1
    `).get();

    if (!assignedUser) {
      db.prepare('INSERT INTO background_jobs (id, job_type, status, details) VALUES (?, ?, ?, ?)')
        .run(jobId, 'followup_reminder', 'skipped', 'No active assignments found');
      return { status: 'skipped', message: 'No assignments found' };
    }

    const { user_id, entity_type, role } = assignedUser;
    const notifId = 'ntf_' + Math.random().toString(36).substring(2, 10);
    const title = 'Background Worker: Account Follow-up';
    const message = `Automated check-in: Review ${entity_type} assignment (Role: ${role}).`;

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, role, is_read)
      VALUES (?, ?, 'reminder', ?, ?, ?, ?, ?, 0)
    `).run(notifId, user_id, title, message, entity_type, assignedUser.entity_id, role);

    const notificationPayload = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);

    if (this.io) {
      this.io.to(`user:${user_id}`).emit('notification', notificationPayload);
    }

    db.prepare('INSERT INTO background_jobs (id, job_type, status, details) VALUES (?, ?, ?, ?)')
      .run(jobId, 'followup_reminder', 'success', `Delivered notification to ${user_id}`);

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

    let title = 'System Alert';
    let message = 'Automated background check completed.';

    if (jobType === 'weekly_digest') {
      title = 'Weekly CRM Activity Summary';
      message = 'Background Service: You have pending high-priority leads needing contact.';
    } else if (jobType === 'stale_lead') {
      title = 'Stale Lead Re-engagement Alert';
      message = 'Background Worker: Account inactive for 7 days. Time to send follow-up.';
    }

    const notifId = 'ntf_' + Math.random().toString(36).substring(2, 10);
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, is_read)
      VALUES (?, ?, 'reminder', ?, ?, 0)
    `).run(notifId, targetUserId, title, message);

    const notificationPayload = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);

    if (this.io) {
      this.io.to(`user:${targetUserId}`).emit('notification', notificationPayload);
    }

    db.prepare('INSERT INTO background_jobs (id, job_type, status, details) VALUES (?, ?, ?, ?)')
      .run(jobId, jobType || 'manual', 'success', `Delivered to ${user.name}`);

    return {
      status: 'success',
      job_id: jobId,
      notification: notificationPayload
    };
  }
}

function startWorkerScheduler(app) {
  const io = app.get('io');
  const worker = new NotificationWorker(io);
  worker.start(45000);
  app.set('workerInstance', worker);
  return worker;
}

module.exports = {
  NotificationWorker,
  startWorkerScheduler
};
