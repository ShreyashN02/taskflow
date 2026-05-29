const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireProjectRole } = require('../middleware/auth');

const router = express.Router();

// Get all projects for user
router.get('/', authenticate, (req, res) => {
  const memberships = db.get('projectMembers').filter({ userId: req.user.id }).value();
  const projectIds = memberships.map(m => m.projectId);
  const projects = db.get('projects').filter(p => projectIds.includes(p.id)).value();
  
  const enriched = projects.map(project => {
    const members = db.get('projectMembers').filter({ projectId: project.id }).value();
    const tasks = db.get('tasks').filter({ projectId: project.id }).value();
    const userRole = memberships.find(m => m.projectId === project.id)?.role;
    return {
      ...project,
      memberCount: members.length,
      taskCount: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      userRole
    };
  });
  res.json({ projects: enriched });
});

// Create project
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('description').optional().trim(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, color } = req.body;
  const project = {
    id: uuidv4(),
    name,
    description: description || '',
    color: color || '#6366f1',
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.get('projects').push(project).write();
  // Creator is admin
  db.get('projectMembers').push({
    id: uuidv4(),
    projectId: project.id,
    userId: req.user.id,
    role: 'admin',
    joinedAt: new Date().toISOString()
  }).write();

  res.status(201).json({ project });
});

// Get single project
router.get('/:projectId', authenticate, (req, res) => {
  const { projectId } = req.params;
  const membership = db.get('projectMembers').find({ projectId, userId: req.user.id }).value();
  if (!membership) return res.status(403).json({ error: 'Not a member' });

  const project = db.get('projects').find({ id: projectId }).value();
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.get('projectMembers').filter({ projectId }).value().map(m => {
    const user = db.get('users').find({ id: m.userId }).value();
    const { password: _, ...userOut } = user || {};
    return { ...m, user: userOut };
  });

  res.json({ project: { ...project, userRole: membership.role }, members });
});

// Update project
router.put('/:projectId', authenticate, requireProjectRole(['admin']), [
  body('name').optional().trim().notEmpty(),
], (req, res) => {
  const { projectId } = req.params;
  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.color) updates.color = req.body.color;
  updates.updatedAt = new Date().toISOString();

  db.get('projects').find({ id: projectId }).assign(updates).write();
  const project = db.get('projects').find({ id: projectId }).value();
  res.json({ project });
});

// Delete project
router.delete('/:projectId', authenticate, requireProjectRole(['admin']), (req, res) => {
  const { projectId } = req.params;
  db.get('projects').remove({ id: projectId }).write();
  db.get('projectMembers').remove({ projectId }).write();
  db.get('tasks').remove({ projectId }).write();
  res.json({ message: 'Project deleted' });
});

// Add member
router.post('/:projectId/members', authenticate, requireProjectRole(['admin']), [
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'member']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { projectId } = req.params;
  const { email, role } = req.body;

  const user = db.get('users').find({ email }).value();
  if (!user) return res.status(404).json({ error: 'User not found' });

  const existing = db.get('projectMembers').find({ projectId, userId: user.id }).value();
  if (existing) return res.status(409).json({ error: 'User already a member' });

  const member = {
    id: uuidv4(),
    projectId,
    userId: user.id,
    role,
    joinedAt: new Date().toISOString()
  };
  db.get('projectMembers').push(member).write();
  const { password: _, ...userOut } = user;
  res.status(201).json({ member: { ...member, user: userOut } });
});

// Update member role
router.put('/:projectId/members/:userId', authenticate, requireProjectRole(['admin']), (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  db.get('projectMembers').find({ projectId, userId }).assign({ role }).write();
  res.json({ message: 'Role updated' });
});

// Remove member
router.delete('/:projectId/members/:userId', authenticate, requireProjectRole(['admin']), (req, res) => {
  const { projectId, userId } = req.params;
  db.get('projectMembers').remove({ projectId, userId }).write();
  res.json({ message: 'Member removed' });
});

module.exports = router;
