import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Projects.css';

const COLORS = ['#6366f1','#22c98a','#f0b429','#4da6ff','#f07340','#f05d5d','#a855f7','#ec4899'];

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data.projects)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await api.post('/projects', form);
      setProjects(prev => [...prev, { ...res.data.project, memberCount:1, taskCount:0, completedTasks:0, userRole:'admin' }]);
      setShowModal(false);
      setForm({ name: '', description: '', color: COLORS[0] });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading projects...</div>;

  return (
    <div className="projects-page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-projects">
          <div className="empty-icon">📋</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const progress = project.taskCount > 0 ? Math.round((project.completedTasks / project.taskCount) * 100) : 0;
            return (
              <div key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
                <div className="project-header">
                  <div className="project-color-dot" style={{background: project.color}} />
                  <div className="project-role">{project.userRole}</div>
                </div>
                <h3 className="project-name">{project.name}</h3>
                {project.description && <p className="project-desc">{project.description}</p>}
                <div className="project-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width:`${progress}%`, background: project.color}} />
                  </div>
                  <span className="progress-pct">{progress}%</span>
                </div>
                <div className="project-stats">
                  <span>{project.taskCount} tasks</span>
                  <span>{project.memberCount} members</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal animate-in">
            <div className="modal-header">
              <h2>New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Website Redesign" required />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What's this project about?" rows={3} />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <button key={c} type="button" className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                      style={{background: c}} onClick={() => setForm({...form, color: c})} />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
