import type { Item } from '../types/inventory';

export function normalizeSku(sku: string): string {
  return sku.trim().toLowerCase();
}

export function hasDuplicateSku(items: Item[], sku: string, exceptId?: string): boolean {
  const normalizedSku = normalizeSku(sku);

  return items.some(
    (item) =>
      item.id !== exceptId &&
      typeof item.sku === 'string' &&
      normalizeSku(item.sku) === normalizedSku,
  );
}
