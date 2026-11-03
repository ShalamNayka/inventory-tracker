import { createContext } from 'react';
import type { AuthUser, UserRole } from '../types/inventory';

// ─── Shape of the context value ──────────────────────────────────────────────
export type RoleContextValue = {
  role: UserRole;
  isAdmin: boolean;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (role: UserRole, username: string) => void;
  logout: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

// ─── Context (null means it is used outside the provider) ────────────────────
export const RoleContext = createContext<RoleContextValue | null>(null);
