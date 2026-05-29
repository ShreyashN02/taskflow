const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_secret_2024';

// Signup
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  const existing = db.get('users').find({ email }).value();
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };

  db.get('users').push(user).write();
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userOut } = user;
  res.status(201).json({ token, user: userOut });
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = db.get('users').find({ email }).value();
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userOut } = user;
  res.json({ token, user: userOut });
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  const { password: _, ...userOut } = req.user;
  res.json({ user: userOut });
});

// Update profile
router.put('/profile', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  const { name } = req.body;
  db.get('users').find({ id: req.user.id }).assign({ name }).write();
  const user = db.get('users').find({ id: req.user.id }).value();
  const { password: _, ...userOut } = user;
  res.json({ user: userOut });
});

// Update password
router.put('/password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'All fields are required.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: 'Current password is incorrect.' });
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.get('users').find({ id: req.user.id }).assign({ password: hashed }).write();
  res.json({ message: 'Password updated.' });
});

module.exports = router;
