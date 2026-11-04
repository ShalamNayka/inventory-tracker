import type { Category, InventoryNotification, Item, StockMovement } from '../types/inventory';
import { hasDuplicateSku } from '../utils/skuRules';

const API_BASE_URL = 'http://localhost:3001';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const body = await response.text();
    let message = `API request failed: ${response.status}`;
    if (body) {
      try {
        const errorBody: unknown = JSON.parse(body);
        if (
          typeof errorBody === 'object' &&
          errorBody !== null &&
          'error' in errorBody &&
          typeof errorBody.error === 'string'
        ) {
          message = errorBody.error;
        }
      } catch {
        message = body;
      }
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function getItems(signal?: AbortSignal): Promise<Item[]> {
  return request<Item[]>('/items', { signal });
}

export function getCategories(signal?: AbortSignal): Promise<Category[]> {
  return request<Category[]>('/categories', { signal });
}

export function createCategory(category: Omit<Category, 'id'>): Promise<Category> {
  return request<Category>('/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  });
}

export function updateCategory(
  id: string,
  updates: Partial<Omit<Category, 'id'>>,
): Promise<Category> {
  return request<Category>(`/categories/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return request<void>(`/categories/${id}`, { method: 'DELETE' });
}

export function getStockMovements(signal?: AbortSignal): Promise<StockMovement[]> {
  return request<StockMovement[]>('/stockMovements', { signal });
}

export function getNotifications(signal?: AbortSignal): Promise<InventoryNotification[]> {
  return request<InventoryNotification[]>('/notifications', { signal });
}

export function createNotification(
  notification: Omit<InventoryNotification, 'id'>,
): Promise<InventoryNotification> {
  return request<InventoryNotification>('/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notification),
  });
}

export function markNotificationRead(id: string): Promise<InventoryNotification> {
  return request<InventoryNotification>(`/notifications/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isRead: true }),
  });
}

export function createItem(item: Omit<Item, 'id'>): Promise<Item> {
  return validateItemSku(item.sku).then(() =>
    request<Item>('/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...item, sku: item.sku?.trim() }),
    }),
  );
}

export async function updateItem(
  id: string,
  updates: Partial<Omit<Item, 'id'>>,
): Promise<Item> {
  if (updates.sku !== undefined) {
    await validateItemSku(updates.sku, id);
    updates = { ...updates, sku: updates.sku.trim() };
  }

  return request<Item>(`/items/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
}

async function validateItemSku(sku: string | undefined, exceptId?: string): Promise<void> {
  const normalizedSku = sku?.trim();
  if (!normalizedSku) {
    throw new Error('SKU is required.');
  }

  const items = await getItems();
  if (hasDuplicateSku(items, normalizedSku, exceptId)) {
    throw new Error('This SKU already exists');
  }
}

export function createStockMovement(movement: Omit<StockMovement, 'id'>): Promise<StockMovement> {
  return request<StockMovement>('/stockMovements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movement),
  });
}

export function updateItemStock(id: string, stock: number): Promise<Item> {
  return request<Item>(`/items/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stock }),
  });
}

export function deleteItem(id: string): Promise<void> {
  return request<void>(`/items/${id}`, { method: 'DELETE' });
}
