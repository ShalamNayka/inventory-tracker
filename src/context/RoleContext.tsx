import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, UserRole } from '../types/inventory';
import { RoleContext } from './RoleContext';

const AUTH_STORAGE_KEY = 'inv_tracker_auth';
const SIDEBAR_STORAGE_KEY = 'inv_tracker_sidebar_collapsed';

// ─── Provider component ───────────────────────────────────────────────────────
export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as AuthUser;
      }
    } catch {
      // ignore JSON parse errors
    }
    // Default to admin user for convenience or null if login is enforced
    return { username: 'Admin User', role: 'admin' };
  });

  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const role: UserRole = user?.role ?? 'viewer';

  const login = (newRole: UserRole, username: string) => {
    const newUser: AuthUser = { username, role: newRole };
    setUser(newUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
    } catch {
      // ignore
    }
  }, [isSidebarCollapsed]);

  const value = {
    role,
    isAdmin: role === 'admin',
    user,
    isAuthenticated: user !== null,
    login,
    logout,
    isSidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
