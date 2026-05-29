const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Search users by email (for adding to projects)
router.get('/search', authenticate, (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email query required' });
  const users = db.get('users')
    .filter(u => u.email.includes(email) && u.id !== req.user.id)
    .value()
    .slice(0, 5)
    .map(({ password: _, ...u }) => u);
  res.json({ users });
});

module.exports = router;
