import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Settings } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>TaskFlow</h1>
        <span>Team Management</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Main</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={16} /><span>Dashboard</span>
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <FolderKanban size={16} /><span>Projects</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <CheckSquare size={16} /><span>My Tasks</span>
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <div className="nav-section-title" style={{ marginTop: '12px' }}>Admin</div>
            <NavLink to="/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Users size={16} /><span>Users</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="user-info">
          <div className="name truncate">{user?.name}</div>
          <div className="role-text">{user?.role}</div>
        </div>
        <button className="btn-icon" onClick={handleLogout} title="Logout">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
