import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/inventorySchemas';
import type { LoginFormData } from '../schemas/inventorySchemas';
import { useRole } from '../hooks/useRole';
import type { UserRole } from '../types/inventory';

function LoginPage() {
  const [activeTab, setActiveTab] = useState<UserRole>('admin');
  const [authError, setAuthError] = useState<string | null>(null);
  const { login } = useRole();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'admin@inventory.com',
      password: 'password123',
    },
  });

  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setAuthError(null);
    if (role === 'admin') {
      setValue('username', 'admin@inventory.com');
      setValue('password', 'password123');
    } else {
      setValue('username', 'viewer@inventory.com');
      setValue('password', 'password123');
    }
  };

  const onSubmit = (data: LoginFormData) => {
    setAuthError(null);
    // Simple authentication check for demonstration
    if (data.password.length < 4) {
      setAuthError('Password must be at least 4 characters');
      return;
    }

    login(activeTab, data.username);
    navigate('/');
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo-icon">📦</span>
          <h1>InvTracker Login</h1>
          <p>Select your portal access level to continue</p>
        </div>

        {/* Tab switchers */}
        <div className="login-role-tabs">
          <button
            type="button"
            className={`login-role-tab ${activeTab === 'admin' ? 'active-admin' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            <span className="tab-icon">🔑</span>
            <div>
              <strong>Admin Portal</strong>
              <small>Full Inventory &amp; Stock Control</small>
            </div>
          </button>

          <button
            type="button"
            className={`login-role-tab ${activeTab === 'viewer' ? 'active-viewer' : ''}`}
            onClick={() => handleTabChange('viewer')}
          >
            <span className="tab-icon">👁️</span>
            <div>
              <strong>Viewer Portal</strong>
              <small>Read-Only Inventory Access</small>
            </div>
          </button>
        </div>

        {authError && (
          <div className="alert alert-error" role="alert">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
          <div className="form-group">
            <label htmlFor="login-username">
              {activeTab === 'admin' ? 'Admin Email / Username' : 'Viewer Email / Username'}
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              className={errors.username ? 'input-error' : ''}
              {...register('username')}
            />
            {errors.username && <span className="field-error">{errors.username.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={errors.password ? 'input-error' : ''}
              {...register('password')}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <div className="login-permissions-preview">
            <span className="permissions-label">Included Permissions:</span>
            {activeTab === 'admin' ? (
              <ul className="permissions-list">
                <li>✓ Create, Edit &amp; Delete Products</li>
                <li>✓ Stock In &amp; Stock Out Operations</li>
                <li>✓ Category Totals &amp; Real-Time Analytics</li>
                <li>✓ Full Audit Trail &amp; Movement Logs</li>
              </ul>
            ) : (
              <ul className="permissions-list">
                <li>✓ Browse Products &amp; Search by Name / SKU</li>
                <li>✓ Filter by Category &amp; Sort by Stock Level</li>
                <li>✓ View Low-Stock Indicators &amp; Category Totals</li>
                <li>✗ Read-Only: No edit, delete or stock adjustments</li>
              </ul>
            )}
          </div>

          <button
            type="submit"
            className={`btn-primary login-submit-btn ${
              activeTab === 'admin' ? 'btn-admin' : 'btn-viewer'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Authenticating...'
              : `Sign in as ${activeTab === 'admin' ? 'Admin' : 'Viewer'}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
