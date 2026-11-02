import { createContext } from 'react';
import type { Category, Item, StockMovement } from '../types/inventory';

export type InventoryCtx = {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  categories: Category[];
  movements: StockMovement[];
  setMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  loading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
};

export const InventoryContext = createContext<InventoryCtx | null>(null);

