const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const memberships = db.get('projectMembers').filter({ userId: req.user.id }).value();
  const projectIds = memberships.map(m => m.projectId);

  const allTasks = db.get('tasks').filter(t => projectIds.includes(t.projectId)).value();
  const now = new Date();

  const stats = {
    totalProjects: projectIds.length,
    totalTasks: allTasks.length,
    tasksByStatus: {
      todo: allTasks.filter(t => t.status === 'todo').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      review: allTasks.filter(t => t.status === 'review').length,
      done: allTasks.filter(t => t.status === 'done').length,
    },
    myTasks: allTasks.filter(t => t.assigneeId === req.user.id).length,
    overdueTasks: allTasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    ).length,
    completionRate: allTasks.length > 0
      ? Math.round((allTasks.filter(t => t.status === 'done').length / allTasks.length) * 100)
      : 0
  };

  // Recent tasks
  const recentTasks = allTasks
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 10)
    .map(task => {
      const project = db.get('projects').find({ id: task.projectId }).value();
      const assignee = task.assigneeId ? db.get('users').find({ id: task.assigneeId }).value() : null;
      const { password: _, ...assigneeOut } = assignee || {};
      return { ...task, project, assignee: assignee ? assigneeOut : null };
    });

  // Overdue tasks
  const overdueTasks = allTasks
    .filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done')
    .map(task => {
      const project = db.get('projects').find({ id: task.projectId }).value();
      return { ...task, project };
    });

  // My assigned tasks
  const myTasks = allTasks
    .filter(t => t.assigneeId === req.user.id && t.status !== 'done')
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    })
    .slice(0, 10)
    .map(task => {
      const project = db.get('projects').find({ id: task.projectId }).value();
      return { ...task, project };
    });

  res.json({ stats, recentTasks, overdueTasks, myTasks });
});

module.exports = router;
