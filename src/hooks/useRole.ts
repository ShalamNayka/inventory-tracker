import { useContext } from 'react';
import { RoleContext } from '../context/RoleContext';
import type { RoleContextValue } from '../context/RoleContext';

// ─── Custom hook – throws if used outside the provider ───────────────────────
export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);

  if (context === null) {
    throw new Error('useRole must be used inside <RoleProvider>.');
  }

  return context;
}
