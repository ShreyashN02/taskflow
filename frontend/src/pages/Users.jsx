import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Trash2, Shield, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.users)).finally(() => setLoading(false));
  }, []);

  const changeRole = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      toast.success('Role updated');
    } catch (err) { toast.error('Error updating role'); }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete user ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p>{users.length} registered users</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '500px', marginBottom: '24px' }}>
        <div className="stat-card purple">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
          <div className="stat-label">Admins</div>
        </div>
        <div className="stat-card green">
          <div className="stat-number">{users.filter(u => u.role === 'member').length}</div>
          <div className="stat-label">Members</div>
        </div>
      </div>

      <div className="filter-bar">
        <input className="form-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px' }}>No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>{u.name[0]}</div>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{u.name}</div>
                        {u.id === user.id && <span style={{ fontSize: '11px', color: 'var(--accent-2)' }}>You</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: '13px' }}>{u.email}</td>
                  <td>
                    {u.id === user.id ? (
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                    ) : (
                      <select
                        className="form-select"
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '13px' }}
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: '13px' }}>{format(parseISO(u.created_at), 'MMM d, yyyy')}</td>
                  <td>
                    {u.id !== user.id && (
                      <button className="btn-icon" onClick={() => deleteUser(u.id, u.name)} title="Delete user">
                        <Trash2 size={14} style={{ color: 'var(--red)' }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
