import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createItem,
  createCategory,
  createNotification,
  createStockMovement,
  deleteCategory,
  deleteItem,
  getCategories,
  getItems,
  getNotifications,
  getStockMovements,
  updateItem,
  updateCategory,
  updateItemStock,
  markNotificationRead,
} from './inventoryApi';
import type { Category, InventoryNotification, Item, StockMovement } from '../types/inventory';
import type { CategoryFormData } from '../schemas/inventorySchemas';
import { processStockMovement } from '../utils/inventoryRules';
import { createRefreshedConditionNotifications, createStockChangeNotification } from '../utils/stockNotifications';

export const QUERY_KEYS = {
  items: ['items'] as const,
  categories: ['categories'] as const,
  stockMovements: ['stockMovements'] as const,
  notifications: ['notifications'] as const,
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

export function useNotifications() {
  return useQuery<InventoryNotification[], Error>({
    queryKey: QUERY_KEYS.notifications,
    queryFn: async ({ signal }) => {
      const [items, existingNotifications] = await Promise.all([
        getItems(signal),
        getNotifications(signal),
      ]);
      const pendingNotifications = createRefreshedConditionNotifications(
        items,
        existingNotifications,
      );
      const createdNotifications = await Promise.all(
        pendingNotifications.map((notification) => createNotification(notification)),
      );

      return [...existingNotifications, ...createdNotifications].toSorted((first, second) =>
        second.createdAt.localeCompare(first.createdAt),
      );
    },
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => markNotificationRead(id))),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newItem: Omit<Item, 'id'>) => createItem(newItem),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: CategoryFormData) => createCategory(category),
    onSuccess: (createdCategory) => {
      queryClient.setQueryData<Category[]>(QUERY_KEYS.categories, (current = []) => {
        return current.some((category) => category.id === createdCategory.id)
          ? current
          : [...current, createdCategory];
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CategoryFormData }) =>
      updateCategory(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const items = await getItems();
      queryClient.setQueryData<Item[]>(QUERY_KEYS.items, items);
      if (items.some((item) => item.categoryId === id)) {
        throw new Error('Reassign or remove this category’s products before deleting it.');
      }

      await deleteCategory(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
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
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
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
      let movement: StockMovement;
      try {
        movement = await createStockMovement({
          itemId: item.id,
          type,
          quantity,
          reason,
          createdAt,
        });
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

      const notification = createStockChangeNotification(item, updatedItem, { type, quantity });
      if (notification) {
        await createNotification(notification).catch(() => null);
      }

      return { updatedItem, movement };
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
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}
