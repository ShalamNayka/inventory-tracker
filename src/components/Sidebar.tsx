import { NavLink } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

const links = [
  { to: '/', icon: '📊', label: 'Overview' },
  { to: '/inventory', icon: '📦', label: 'Inventory' },
  { to: '/stock-history', icon: '📋', label: 'Stock History' },
  { to: '/categories', icon: '🗂️', label: 'Categories' },
];

function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar } = useRole();

  return (
    <aside className={`sidebar ${isSidebarCollapsed ? 'sidebar--collapsed' : 'sidebar--expanded'}`}>
      <div className="sidebar-logo">
        <div className="logo-main">
          <span className="logo-icon">📦</span>
          {!isSidebarCollapsed && (
            <div className="logo-text">
              <h2>InvTracker</h2>
              <p>Inventory Management</p>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className="sidebar-collapse-toggle"
        onClick={toggleSidebar}
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!isSidebarCollapsed}
        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        ☰
      </button>

      <nav className="sidebar-nav">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={isSidebarCollapsed ? label : undefined}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {!isSidebarCollapsed && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}

export default Sidebar;
