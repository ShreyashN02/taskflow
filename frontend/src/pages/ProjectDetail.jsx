import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isPast, parseISO } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

const STATUS_COLS = [
  { key: 'todo', label: 'To Do', color: '#5a5a78' },
  { key: 'in_progress', label: 'In Progress', color: '#4da6ff' },
  { key: 'review', label: 'Review', color: '#f0b429' },
  { key: 'done', label: 'Done', color: '#22c98a' },
];
const PRIORITY_COLORS = { low:'#22c98a', medium:'#f0b429', high:'#f07340', urgent:'#f05d5d' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title:'', description:'', assigneeId:'', priority:'medium', status:'todo', dueDate:'' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberError, setMemberError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`)
    ]).then(([pRes, tRes]) => {
      setProject(pRes.data.project);
      setMembers(pRes.data.members);
      setTasks(tRes.data.tasks);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openCreateTask = (status = 'todo') => {
    setEditingTask(null);
    setTaskForm({ title:'', description:'', assigneeId:'', priority:'medium', status, dueDate:'' });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title, description: task.description,
      assigneeId: task.assigneeId || '', priority: task.priority,
      status: task.status, dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...taskForm, projectId: id, assigneeId: taskForm.assigneeId || null, dueDate: taskForm.dueDate || null };
      if (editingTask) {
        const res = await api.put(`/tasks/${editingTask.id}`, payload);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data.task : t));
      } else {
        const res = await api.post('/tasks', payload);
        setTasks(prev => [...prev, res.data.task]);
      }
      setShowTaskModal(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await api.put(`/tasks/${taskId}`, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setShowTaskModal(false);
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setSaving(true); setMemberError('');
    try {
      const res = await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setMembers(prev => [...prev, res.data.member]);
      setShowMemberModal(false); setMemberEmail('');
    } catch (err) { setMemberError(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    setMembers(prev => prev.filter(m => m.userId !== userId));
  };

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!project) return <div className="page-loading">Project not found</div>;

  const isAdmin = project.userRole === 'admin';

  return (
    <div className="project-detail animate-in">
      <div className="project-detail-header">
        <button className="back-btn" onClick={() => navigate('/projects')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Projects
        </button>
        <div className="project-detail-title">
          <div className="project-color-dot" style={{background: project.color, width:14, height:14, borderRadius:'50%'}} />
          <h1>{project.name}</h1>
          <span className="role-badge">{project.userRole}</span>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button className="btn-ghost" onClick={() => setShowMemberModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              Add Member
            </button>
          )}
          <button className="btn-primary" onClick={() => openCreateTask()}>+ New Task</button>
        </div>
      </div>

      <div className="project-tabs">
        {['board','list','members'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'board' && (
        <div className="board-view">
          {STATUS_COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="board-col">
                <div className="col-header">
                  <span className="col-dot" style={{background: col.color}} />
                  <span className="col-label">{col.label}</span>
                  <span className="col-count">{colTasks.length}</span>
                </div>
                <div className="col-tasks">
                  {colTasks.map(task => (
                    <div key={task.id} className="task-card" onClick={() => openEditTask(task)}>
                      <div className="task-card-top">
                        <span className="task-card-title">{task.title}</span>
                        <span className="priority-dot" style={{background: PRIORITY_COLORS[task.priority]}} title={task.priority} />
                      </div>
                      {task.description && <p className="task-card-desc">{task.description}</p>}
                      <div className="task-card-foot">
                        {task.assignee && (
                          <div className="assignee-mini">
                            <div className="avatar-mini">{task.assignee.name?.[0]}</div>
                          </div>
                        )}
                        {task.dueDate && (
                          <span className={`task-due ${isPast(parseISO(task.dueDate)) && task.status !== 'done' ? 'overdue' : ''}`}>
                            {format(parseISO(task.dueDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <button className="add-task-btn" onClick={() => openCreateTask(col.key)}>+ Add task</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'list' && (
        <div className="list-view">
          <table className="task-table">
            <thead>
              <tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due Date</th></tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={5} className="table-empty">No tasks yet</td></tr>
              ) : tasks.map(task => (
                <tr key={task.id} onClick={() => openEditTask(task)} className="table-row">
                  <td>
                    <span className="task-title-cell">{task.title}</span>
                    {task.description && <span className="task-desc-cell">{task.description}</span>}
                  </td>
                  <td>{task.assignee ? (
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div className="avatar-mini">{task.assignee.name?.[0]}</div>
                      <span style={{fontSize:13}}>{task.assignee.name}</span>
                    </div>
                  ) : <span className="unassigned">—</span>}</td>
                  <td><span className="priority-tag" style={{color: PRIORITY_COLORS[task.priority]}}>{task.priority}</span></td>
                  <td>
                    <select value={task.status} className="status-select"
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); handleStatusChange(task.id, e.target.value); }}>
                      {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </td>
                  <td>{task.dueDate ? <span className={isPast(parseISO(task.dueDate)) && task.status !== 'done' ? 'overdue-text' : ''}>{format(parseISO(task.dueDate), 'MMM d, yyyy')}</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'members' && (
        <div className="members-view">
          {members.map(m => (
            <div key={m.id} className="member-row">
              <div className="avatar" style={{width:38,height:38,fontSize:16}}>{m.user?.name?.[0]}</div>
              <div className="member-info">
                <span className="member-name">{m.user?.name} {m.userId === user.id && <span className="you-badge">You</span>}</span>
                <span className="member-email">{m.user?.email}</span>
              </div>
              <span className={`role-badge ${m.role}`}>{m.role}</span>
              {isAdmin && m.userId !== user.id && (
                <button className="remove-btn" onClick={() => handleRemoveMember(m.userId)}>Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal animate-in">
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label>Title</label>
                <input value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="Task title" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="Optional description..." rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assignee</label>
                  <select value={taskForm.assigneeId} onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.userId} value={m.userId}>{m.user?.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                    {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                {editingTask && <button type="button" className="btn-danger" onClick={() => handleDeleteTask(editingTask.id)}>Delete</button>}
                <div style={{flex:1}} />
                <button type="button" className="btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : (editingTask ? 'Save' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMemberModal(false)}>
          <div className="modal animate-in">
            <div className="modal-header">
              <h2>Add Member</h2>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            {memberError && <div className="form-error">{memberError}</div>}
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>User Email</label>
                <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="user@example.com" required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
