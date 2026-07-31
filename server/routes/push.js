const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const db = require('../db');

const vapidKeys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  'mailto:support@apexcrm.internal',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

router.post('/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'Missing userId or subscription payload' });
  }

  const subJson = JSON.stringify(subscription);
  const existing = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').get(userId, subscription.endpoint);
  
  if (!existing) {
    db.prepare('INSERT INTO push_subscriptions (id, user_id, endpoint, subscription_json) VALUES (?, ?, ?, ?)').run(
      'sub_' + Math.random().toString(36).substring(2, 9),
      userId,
      subscription.endpoint,
      subJson
    );
  }

  res.json({ success: true, message: 'Web Push subscription registered' });
});

module.exports = {
  router,
  webpush,
  vapidKeys
};
