import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isPast, parseISO } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './TaskDetail.css';

const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', review:'Review', done:'Done' };
const PRIORITY_COLORS = { low:'#22c98a', medium:'#f0b429', high:'#f07340', urgent:'#f05d5d' };

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/tasks/${id}`).then(res => setTask(res.data.task)).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    await api.put(`/tasks/${id}`, { status });
    setTask(prev => ({ ...prev, status }));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    const res = await api.post(`/tasks/${id}/comments`, { content: comment });
    setTask(prev => ({ ...prev, comments: [...(prev.comments || []), res.data.comment] }));
    setComment('');
    setSubmitting(false);
  };

  if (loading) return <div className="page-loading">Loading task...</div>;
  if (!task) return <div className="page-loading">Task not found</div>;

  return (
    <div className="task-detail animate-in">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div className="task-detail-content">
        <div className="task-main">
          <div className="task-detail-header">
            <h1 className="task-detail-title">{task.title}</h1>
            <span className="priority-badge-lg" style={{color: PRIORITY_COLORS[task.priority]}}>{task.priority}</span>
          </div>
          {task.description && <p className="task-description">{task.description}</p>}

          <div className="task-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Status</span>
              <select className="meta-select" value={task.status} onChange={e => handleStatusChange(e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="meta-item">
              <span className="meta-label">Assignee</span>
              <span className="meta-value">{task.assignee?.name || 'Unassigned'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Project</span>
              <span className="meta-value" style={{color:'var(--accent2)',cursor:'pointer'}} onClick={() => navigate(`/projects/${task.projectId}`)}>
                {task.project?.name || 'View Project'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Due Date</span>
              <span className={`meta-value ${task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done' ? 'overdue' : ''}`}>
                {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : 'No due date'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Created</span>
              <span className="meta-value">{format(parseISO(task.createdAt), 'MMM d, yyyy')}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">By</span>
              <span className="meta-value">{task.creator?.name}</span>
            </div>
          </div>
        </div>

        <div className="task-sidebar">
          <div className="comments-section">
            <h3>Comments ({task.comments?.length || 0})</h3>
            <div className="comments-list">
              {(task.comments || []).length === 0 ? (
                <div className="no-comments">No comments yet</div>
              ) : (
                task.comments.map(c => (
                  <div key={c.id} className="comment">
                    <div className="comment-avatar">{c.user?.name?.[0]}</div>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <span className="comment-author">{c.user?.name}</span>
                        <span className="comment-time">{format(parseISO(c.createdAt), 'MMM d')}</span>
                      </div>
                      <p className="comment-text">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleComment} className="comment-form">
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." rows={3} />
              <button type="submit" className="btn-primary" disabled={submitting || !comment.trim()}>
                {submitting ? 'Posting...' : 'Comment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
