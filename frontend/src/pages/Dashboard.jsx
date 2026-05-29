import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isPast, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const STATUS_COLORS = { todo: '#5a5a78', in_progress: '#4da6ff', review: '#f0b429', done: '#22c98a' };
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_COLORS = { low: '#22c98a', medium: '#f0b429', high: '#f07340', urgent: '#f05d5d' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;
  const { stats, recentTasks, overdueTasks, myTasks } = data;

  const chartData = Object.entries(stats.tasksByStatus).map(([key, val]) => ({
    name: STATUS_LABELS[key], value: val, color: STATUS_COLORS[key]
  })).filter(d => d.value > 0);

  return (
    <div className="dashboard animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user.name.split(' ')[0]}</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
        <span className="date-badge">{format(new Date(), 'EEEE, MMM d')}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(124,111,239,0.1)',color:'var(--accent)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
          </div>
          <div>
            <div className="stat-value">{stats.totalProjects}</div>
            <div className="stat-label">Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(77,166,255,0.1)',color:'var(--blue)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
          </div>
          <div>
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(34,201,138,0.1)',color:'var(--green)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className="stat-value">{stats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
        <div className="stat-card" style={{borderColor: stats.overdueTasks > 0 ? 'rgba(240,93,93,0.3)' : undefined}}>
          <div className="stat-icon" style={{background:'rgba(240,93,93,0.1)',color:'var(--red)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div className="stat-value" style={{color: stats.overdueTasks > 0 ? 'var(--red)' : undefined}}>{stats.overdueTasks}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-section">
          <h2 className="section-title">My Tasks</h2>
          {myTasks.length === 0 ? (
            <div className="empty-state">No tasks assigned to you</div>
          ) : (
            <div className="task-list">
              {myTasks.map(task => (
                <div key={task.id} className="task-row" onClick={() => navigate(`/tasks/${task.id}`)}>
                  <div className="task-status-dot" style={{background: STATUS_COLORS[task.status]}} />
                  <div className="task-info">
                    <span className="task-title-text">{task.title}</span>
                    <span className="task-project-name">{task.project?.name}</span>
                  </div>
                  <div className="task-meta">
                    <span className="priority-badge" style={{color: PRIORITY_COLORS[task.priority]}}>{task.priority}</span>
                    {task.dueDate && (
                      <span className={`due-date ${isPast(parseISO(task.dueDate)) ? 'overdue' : ''}`}>
                        {format(parseISO(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-section">
          <h2 className="section-title">Task Distribution</h2>
          {chartData.length > 0 ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#fff',border:'1px solid #e0e0db',borderRadius:'6px',color:'#1a1a1a'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {chartData.map((d, i) => (
                  <div key={i} className="legend-item">
                    <span className="legend-dot" style={{background: d.color}} />
                    <span>{d.name}</span>
                    <span className="legend-val">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">No tasks yet</div>
          )}
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className="dash-section" style={{marginTop: 24}}>
          <h2 className="section-title" style={{color:'var(--red)'}}>Overdue Tasks</h2>
          <div className="task-list">
            {overdueTasks.map(task => (
              <div key={task.id} className="task-row overdue-row" onClick={() => navigate(`/tasks/${task.id}`)}>
                <div className="task-status-dot" style={{background:'var(--red)'}} />
                <div className="task-info">
                  <span className="task-title-text">{task.title}</span>
                  <span className="task-project-name">{task.project?.name}</span>
                </div>
                <span className="due-date overdue">Due {format(parseISO(task.dueDate), 'MMM d, yyyy')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}