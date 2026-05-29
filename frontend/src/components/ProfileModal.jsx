import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './ProfileModal.css';

export default function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      const res = await api.put('/auth/profile', { name });
      if (setUser) setUser(res.data.user);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setMessage('Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="profile-modal">
        <div className="profile-header">
          <h2>Account</h2>
          <button className="profile-close" onClick={onClose}>✕</button>
        </div>

        <div className="profile-avatar-section">
          <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="profile-name">{user?.name}</div>
            <div className="profile-email">{user?.email}</div>
          </div>
        </div>

        <div className="profile-tabs">
          <button className={`profile-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => { setTab('profile'); setMessage(''); setError(''); }}>
            Profile
          </button>
          <button className={`profile-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => { setTab('password'); setMessage(''); setError(''); }}>
            Change Password
          </button>
        </div>

        {message && <div className="profile-success">{message}</div>}
        {error && <div className="profile-error">{error}</div>}

        {tab === 'profile' && (
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={user?.email} disabled style={{opacity:0.6, cursor:'not-allowed'}} />
              <span className="field-hint">Email cannot be changed.</span>
            </div>
            <div className="profile-actions">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required />
            </div>
            <div className="profile-actions">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}