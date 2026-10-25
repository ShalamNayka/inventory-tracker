import type { Category, Item, StockMovement } from '../types/inventory';

const API_BASE_URL = 'http://localhost:3001';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getItems(signal?: AbortSignal): Promise<Item[]> {
  return request<Item[]>('/items', { signal });
}

export function getCategories(signal?: AbortSignal): Promise<Category[]> {
  return request<Category[]>('/categories', { signal });
}

export function getStockMovements(signal?: AbortSignal): Promise<StockMovement[]> {
  return request<StockMovement[]>('/stockMovements', { signal });
}

export function createItem(item: Omit<Item, 'id'>): Promise<Item> {
  return request<Item>('/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });
}

export function updateItem(id: string, updates: Partial<Omit<Item, 'id'>>): Promise<Item> {
  return request<Item>(`/items/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
}
