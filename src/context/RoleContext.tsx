import { useState } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from '../types/inventory';
import { RoleContext } from './RoleContext';

// ─── Provider component ───────────────────────────────────────────────────────
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('viewer');

  const value = {
    role,
    setRole,
    isAdmin: role === 'admin',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

