const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'taskflow_secret_2024');
    const user = db.get('users').find({ id: decoded.id }).value();
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireProjectRole = (roles) => (req, res, next) => {
  const projectId = req.params.projectId || req.body.projectId;
  const member = db.get('projectMembers')
    .find({ projectId, userId: req.user.id })
    .value();
  if (!member || !roles.includes(member.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  req.projectMember = member;
  next();
};

module.exports = { authenticate, requireProjectRole };
