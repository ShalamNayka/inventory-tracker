import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getItems, getCategories, getStockMovements } from '../api/inventoryApi';
import type { Category, Item, StockMovement } from '../types/inventory';
import { InventoryContext } from '../context/InventoryContext';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [catState, setCatState] = useState<Category[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [loadedItems, loadedCats, loadedMoves] = await Promise.all([
          getItems(controller.signal),
          getCategories(controller.signal),
          getStockMovements(controller.signal),
        ]);
        if (!controller.signal.aborted) {
          setItems(loadedItems);
          setCatState(loadedCats);
          setMovements(loadedMoves);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load inventory.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        items,
        setItems,
        categories: catState,
        movements,
        setMovements,
        loading,
        error,
        setError,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}
