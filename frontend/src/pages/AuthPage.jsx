import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password, form.role);
      }
      toast.success(`Welcome${form.name ? ', ' + form.name : ''}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, var(--accent), #a78bfa)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TaskFlow</h1>
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Team Task Management Platform</p>
        </div>

        <div className="card" style={{ border: '1px solid var(--border-light)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', padding: '4px', marginBottom: '24px' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: '500', transition: 'all 0.15s',
                  background: mode === m ? 'var(--bg-2)' : 'transparent',
                  color: mode === m ? 'var(--text)' : 'var(--text-2)',
                  boxShadow: mode === m ? 'var(--shadow)' : 'none',
                }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'} value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Admins can create projects and manage teams.</span>
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '12px' }}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-3)' }}>
              <strong style={{ color: 'var(--text-2)' }}>Demo accounts:</strong>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>Admin: admin@demo.com / password</span>
                <span>Member: member@demo.com / password</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
