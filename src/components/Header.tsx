import { useRole } from '../hooks/useRole';
import type { UserRole } from '../types/inventory';

function Header({ title }: { title: string }) {
  const { role, setRole, isAdmin } = useRole();

  return (
    <header className="header">
      <span className="header-title">{title}</span>

      <div className="header-right">
        <div className="role-select-wrap">
          <span>Role:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            aria-label="Switch user role"
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <span className={`badge badge-${isAdmin ? 'admin' : 'viewer'}`}>
            {isAdmin ? '🔑 Admin' : '👁 Viewer'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;

