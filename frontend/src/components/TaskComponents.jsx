import { useState } from 'react';
import { format, isPast, parseISO } from 'date-fns';
import { X, Calendar, User, Flag, Trash2 } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export function StatusBadge({ status }) {
  const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority}`}>{priority}</span>;
}

export function TaskCard({ task, onClick, compact }) {
  const isOverdue = task.due_date && task.status !== 'done' && isPast(parseISO(task.due_date));
  return (
    <div className={`task-card${isOverdue ? ' overdue' : ''}`} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>{task.title}</h4>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.description && !compact && (
        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</p>
      )}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {!compact && <StatusBadge status={task.status} />}
        {task.project_name && <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>📁 {task.project_name}</span>}
        {task.assignee_name && <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '3px' }}><User size={11} />{task.assignee_name}</span>}
        {task.due_date && (
          <span style={{ fontSize: '12px', color: isOverdue ? 'var(--red)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Calendar size={11} />{format(parseISO(task.due_date), 'MMM d')}
            {isOverdue && ' (overdue)'}
          </span>
        )}
      </div>
    </div>
  );
}

export function TaskModal({ task, projectMembers, onClose, onUpdate, onDelete, currentUser, defaultValues }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || defaultValues?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee_id: task?.assignee_id || '',
    due_date: task?.due_date || '',
    project_id: task?.project_id || defaultValues?.project_id || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canEdit = currentUser.role === 'admin' || task?.created_by === currentUser.id || task?.assignee_id === currentUser.id || !task;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null, due_date: form.due_date || null };
      let res;
      if (task) {
        res = await api.put(`/tasks/${task.id}`, payload);
        toast.success('Task updated');
      } else {
        res = await api.post('/tasks', payload);
        toast.success('Task created');
      }
      onUpdate(res.data.task);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success('Task deleted');
      onDelete(task.id);
      onClose();
    } catch (err) {
      toast.error('Error deleting task');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'New Task'}</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {task && (currentUser.role === 'admin' || task.created_by === currentUser.id) && (
              <button className="btn btn-sm btn-danger" onClick={handleDelete}><Trash2 size={13} />Delete</button>
            )}
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" required disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional description..." disabled={!canEdit} />
          </div>
          <div className="two-col" style={{ gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)} disabled={!canEdit}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          {projectMembers && (
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-select" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)} disabled={!canEdit}>
                <option value="">Unassigned</option>
                {projectMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} disabled={!canEdit} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !canEdit}>
              {loading ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
