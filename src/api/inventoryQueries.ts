import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createItem,
  createStockMovement,
  deleteItem,
  getCategories,
  getItems,
  getStockMovements,
  updateItem,
  updateItemStock,
} from './inventoryApi';
import type { Category, Item, StockMovement } from '../types/inventory';
import { processStockMovement } from '../utils/inventoryRules';

export const QUERY_KEYS = {
  items: ['items'] as const,
  categories: ['categories'] as const,
  stockMovements: ['stockMovements'] as const,
};

export function useItems() {
  return useQuery<Item[], Error>({
    queryKey: QUERY_KEYS.items,
    queryFn: ({ signal }) => getItems(signal),
  });
}

export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: QUERY_KEYS.categories,
    queryFn: ({ signal }) => getCategories(signal),
  });
}

export function useStockMovements() {
  return useQuery<StockMovement[], Error>({
    queryKey: QUERY_KEYS.stockMovements,
    queryFn: ({ signal }) => getStockMovements(signal),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newItem: Omit<Item, 'id'>) => createItem(newItem),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Item, 'id'>> }) =>
      updateItem(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
    },
  });
}

type StockMovementInput = {
  item: Item;
  type: StockMovement['type'];
  quantity: number;
  reason: string;
};

export function useStockMovementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, type, quantity, reason }: StockMovementInput) => {
      // 1. Process business rules first
      const movementId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const ruleResult = processStockMovement(item, type, quantity, reason, movementId, createdAt);

      if (!ruleResult.success) {
        throw new Error(ruleResult.error);
      }

      // 2. Persist updated stock
      const updatedItem = await updateItemStock(item.id, ruleResult.updatedItem.stock);

      // 3. Persist movement record
      try {
        const movement = await createStockMovement({
          itemId: item.id,
          type,
          quantity,
          reason,
          createdAt,
        });
        return { updatedItem, movement };
      } catch (err) {
        // Rollback server stock if movement log fails
        await updateItemStock(item.id, item.stock).catch(() => null);
        throw new Error(
          err instanceof Error
            ? `Stock updated but movement logging failed: ${err.message}`
            : 'Movement logging failed',
          { cause: err },
        );
      }
    },

    // ─── Optimistic Update ─────────────────────────────────────────────────────
    onMutate: async ({ item, type, quantity }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.items });

      // Snapshot previous value for rollback
      const previousItems = queryClient.getQueryData<Item[]>(QUERY_KEYS.items);

      // Optimistically update query cache
      if (previousItems) {
        const nextStock = type === 'IN' ? item.stock + quantity : item.stock - quantity;
        queryClient.setQueryData<Item[]>(QUERY_KEYS.items, (old) =>
          (old ?? []).map((i) => (i.id === item.id ? { ...i, stock: nextStock } : i)),
        );
      }

      return { previousItems };
    },

    // If mutation fails, rollback cache to snapshot
    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(QUERY_KEYS.items, context.previousItems);
      }
    },

    // Invalidate and refetch after error or success
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockMovements });
    },
  });
}
