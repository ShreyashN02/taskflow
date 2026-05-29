const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireProjectRole } = require('../middleware/auth');

const router = express.Router();

// Get tasks for a project
router.get('/project/:projectId', authenticate, (req, res) => {
  const { projectId } = req.params;
  const membership = db.get('projectMembers').find({ projectId, userId: req.user.id }).value();
  if (!membership) return res.status(403).json({ error: 'Not a member' });

  const tasks = db.get('tasks').filter({ projectId }).value().map(task => {
    const assignee = task.assigneeId ? db.get('users').find({ id: task.assigneeId }).value() : null;
    const { password: _, ...assigneeOut } = assignee || {};
    return { ...task, assignee: assignee ? assigneeOut : null };
  });
  res.json({ tasks });
});

// Create task
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('projectId').notEmpty().withMessage('Project ID required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, projectId, assigneeId, priority, status, dueDate, tags } = req.body;
  const membership = db.get('projectMembers').find({ projectId, userId: req.user.id }).value();
  if (!membership) return res.status(403).json({ error: 'Not a member' });

  if (assigneeId) {
    const assigneeMember = db.get('projectMembers').find({ projectId, userId: assigneeId }).value();
    if (!assigneeMember) return res.status(400).json({ error: 'Assignee is not a project member' });
  }

  const task = {
    id: uuidv4(),
    title,
    description: description || '',
    projectId,
    assigneeId: assigneeId || null,
    createdBy: req.user.id,
    priority: priority || 'medium',
    status: status || 'todo',
    dueDate: dueDate || null,
    tags: tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.get('tasks').push(task).write();
  const assignee = task.assigneeId ? db.get('users').find({ id: task.assigneeId }).value() : null;
  const { password: _, ...assigneeOut } = assignee || {};
  res.status(201).json({ task: { ...task, assignee: assignee ? assigneeOut : null } });
});

// Get single task
router.get('/:taskId', authenticate, (req, res) => {
  const task = db.get('tasks').find({ id: req.params.taskId }).value();
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = db.get('projectMembers').find({ projectId: task.projectId, userId: req.user.id }).value();
  if (!membership) return res.status(403).json({ error: 'Not a member' });

  const assignee = task.assigneeId ? db.get('users').find({ id: task.assigneeId }).value() : null;
  const creator = db.get('users').find({ id: task.createdBy }).value();
  const comments = db.get('comments').filter({ taskId: task.id }).value().map(c => {
    const user = db.get('users').find({ id: c.userId }).value();
    const { password: _, ...userOut } = user || {};
    return { ...c, user: userOut };
  });

  const { password: p1, ...assigneeOut } = assignee || {};
  const { password: p2, ...creatorOut } = creator || {};
  res.json({ task: { ...task, assignee: assignee ? assigneeOut : null, creator: creatorOut, comments } });
});

// Update task
router.put('/:taskId', authenticate, (req, res) => {
  const task = db.get('tasks').find({ id: req.params.taskId }).value();
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = db.get('projectMembers').find({ projectId: task.projectId, userId: req.user.id }).value();
  if (!membership) return res.status(403).json({ error: 'Not a member' });

  const allowed = ['title', 'description', 'assigneeId', 'priority', 'status', 'dueDate', 'tags'];
  const updates = { updatedAt: new Date().toISOString() };
  allowed.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  db.get('tasks').find({ id: req.params.taskId }).assign(updates).write();
  const updated = db.get('tasks').find({ id: req.params.taskId }).value();
  const assignee = updated.assigneeId ? db.get('users').find({ id: updated.assigneeId }).value() : null;
  const { password: _, ...assigneeOut } = assignee || {};
  res.json({ task: { ...updated, assignee: assignee ? assigneeOut : null } });
});

// Delete task
router.delete('/:taskId', authenticate, (req, res) => {
  const task = db.get('tasks').find({ id: req.params.taskId }).value();
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = db.get('projectMembers').find({ projectId: task.projectId, userId: req.user.id }).value();
  if (!membership || membership.role !== 'admin') {
    if (task.createdBy !== req.user.id) return res.status(403).json({ error: 'Insufficient permissions' });
  }

  db.get('tasks').remove({ id: req.params.taskId }).write();
  db.get('comments').remove({ taskId: req.params.taskId }).write();
  res.json({ message: 'Task deleted' });
});

// Add comment
router.post('/:taskId/comments', authenticate, [
  body('content').trim().notEmpty().withMessage('Comment content required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const task = db.get('tasks').find({ id: req.params.taskId }).value();
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = db.get('projectMembers').find({ projectId: task.projectId, userId: req.user.id }).value();
  if (!membership) return res.status(403).json({ error: 'Not a member' });

  const comment = {
    id: uuidv4(),
    taskId: req.params.taskId,
    userId: req.user.id,
    content: req.body.content,
    createdAt: new Date().toISOString()
  };
  db.get('comments').push(comment).write();
  const { password: _, ...userOut } = req.user;
  res.status(201).json({ comment: { ...comment, user: userOut } });
});

module.exports = router;
