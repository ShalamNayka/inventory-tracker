import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',               icon: '📊', label: 'Overview'      },
  { to: '/inventory',      icon: '📦', label: 'Inventory'     },
  { to: '/stock-history',  icon: '📋', label: 'Stock History' },
  { to: '/categories',     icon: '🗂️',  label: 'Categories'   },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>📦 InvTracker</h2>
        <p>Inventory Management</p>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">Day 1 Assignment</div>
    </aside>
  );
}

export default Sidebar;

