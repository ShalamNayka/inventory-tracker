import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import NotificationBell from './NotificationBell';

function Header({ title }: { title: string }) {
  const { isAdmin, user, logout, toggleSidebar } = useRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-btn"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
        <span className="header-title">{title}</span>
      </div>

      <div className="header-right">
        <NotificationBell />
        {user && (
          <div className="user-profile-badge">
            <span className={`badge badge-${isAdmin ? 'admin' : 'viewer'} header-role-badge`}>
              {isAdmin ? '👑 Admin (Full Access)' : '👁 Viewer (Read Only)'}
            </span>
            <button
              type="button"
              className="btn-secondary btn-sm logout-btn"
              onClick={handleLogout}
              title="Sign out of your session"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
