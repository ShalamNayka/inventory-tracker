import { createContext } from 'react';
import type { UserRole } from '../types/inventory';

// ─── Shape of the context value ──────────────────────────────────────────────
export type RoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
};

// ─── Context (null means it is used outside the provider) ────────────────────
export const RoleContext = createContext<RoleContextValue | null>(null);

