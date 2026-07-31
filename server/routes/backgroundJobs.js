const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const history = db.prepare(`
      SELECT 
        id, 
        COALESCE(job_type, 'scheduled_reminder') as name, 
        status, 
        details, 
        executed_at as created_at
      FROM background_jobs 
      ORDER BY executed_at DESC 
      LIMIT 25
    `).all();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trigger', (req, res) => {
  try {
    const worker = req.app.get('workerInstance');
    const { jobType, targetUserId } = req.body;
    let result;

    if (worker) {
      if (jobType && targetUserId) {
        result = worker.triggerCustomJob(jobType, targetUserId);
      } else {
        result = worker.runScheduledFollowUpJob();
      }
    } else {
      const jobId = 'job_' + Math.random().toString(36).substring(2, 9);
      const notifId = 'ntf_' + Math.random().toString(36).substring(2, 9);
      const targetId = targetUserId || 'usr_sarah';

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, is_read)
        VALUES (?, ?, 'reminder', 'Manual Background Worker Alert', 'Automated CRM account review executed.', 0)
      `).run(notifId, targetId);

      db.prepare(`
        INSERT INTO background_jobs (id, job_type, status, details)
        VALUES (?, ?, 'success', ?)
      `).run(jobId, jobType || 'manual_trigger', `Notification ${notifId} sent to ${targetId}`);

      result = { status: 'success', job_id: jobId };
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
