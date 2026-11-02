import { useContext } from 'react';
import { InventoryContext } from '../context/InventoryContext';
import type { InventoryCtx } from '../context/InventoryContext';

export function useInventoryData(): InventoryCtx {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventoryData must be used inside <InventoryProvider>');
  return ctx;
}
