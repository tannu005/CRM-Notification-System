const express = require('express');
const router = express.Router();

function createBackgroundJobRoutes(worker) {
  router.get('/', (req, res) => {
    const history = worker.getJobHistory();
    res.json(history);
  });

  router.post('/trigger', (req, res) => {
    try {
      const { jobType, targetUserId } = req.body;
      let result;
      if (jobType && targetUserId) {
        result = worker.triggerCustomJob(jobType, targetUserId);
      } else {
        result = worker.runScheduledFollowUpJob();
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createBackgroundJobRoutes;
