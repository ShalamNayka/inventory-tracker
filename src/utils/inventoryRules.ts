import type { Item, StockMovement } from '../types/inventory';

export function isLowStock(item: Item): boolean {
  return item.stock <= item.lowStockThreshold;
}

export function calculateCategoryTotals(items: Item[]): Record<string, number> {
  return items.reduce<Record<string, number>>((totals, item) => {
    totals[item.categoryId] = (totals[item.categoryId] ?? 0) + item.stock;

    return totals;
  }, {});
}

export type StockOperationResult =
  { success: true; updatedItem: Item; movement: StockMovement } | { success: false; error: string };

export function processStockMovement(
  item: Item,
  type: StockMovement['type'],
  quantity: number,
  reason: string,
  movementId: string,
  createdAt: string,
): StockOperationResult {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {
      success: false,
      error: 'Quantity must be a positive integer.',
    };
  }

  if (type === 'OUT' && quantity > item.stock) {
    return {
      success: false,
      error: 'Insufficient stock.',
    };
  }

  const updatedStock = type === 'IN' ? item.stock + quantity : item.stock - quantity;

  const updatedItem: Item = {
    ...item,
    stock: updatedStock,
  };

  const movement: StockMovement = {
    id: movementId,
    itemId: item.id,
    type,
    quantity,
    reason,
    createdAt,
  };

  return {
    success: true,
    updatedItem,
    movement,
  };
}
