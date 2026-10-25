import type { Category, Item, StockMovement } from '../types/inventory';

const API_BASE_URL = 'http://localhost:3001';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getItems(): Promise<Item[]> {
  return request<Item[]>('/items');
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>('/categories');
}

export function getStockMovements(): Promise<StockMovement[]> {
  return request<StockMovement[]>('/stockMovements');
}

export function createItem(item: Omit<Item, 'id'>): Promise<Item> {
  return request<Item>('/items', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}
