import { describe, expect, it } from 'vitest';
import { calculateCategoryTotals, isLowStock, processStockMovement } from './inventoryRules';
import type { Item } from '../types/inventory';

const laptop: Item = {
  id: 'item-1',
  name: 'Laptop',
  categoryId: 'cat-1',
  price: 55000,
  stock: 8,
  lowStockThreshold: 5,
};

describe('isLowStock', () => {
  it('returns true when stock equals the threshold', () => {
    expect(isLowStock({ ...laptop, stock: 5 })).toBe(true);
  });

  it('returns true when stock is below the threshold', () => {
    expect(isLowStock({ ...laptop, stock: 4 })).toBe(true);
  });

  it('returns false when stock exceeds the threshold', () => {
    expect(isLowStock(laptop)).toBe(false);
  });
});

describe('calculateCategoryTotals', () => {
  it('calculates totals by category', () => {
    const items = [
      laptop,
      { ...laptop, id: 'item-2', stock: 4 },
      { ...laptop, id: 'item-3', categoryId: 'cat-2', stock: 3 },
    ];

    expect(calculateCategoryTotals(items)).toEqual({
      'cat-1': 12,
      'cat-2': 3,
    });
  });

  it('returns an empty object when there are no items', () => {
    expect(calculateCategoryTotals([])).toEqual({});
  });

  it('does not modify the original array', () => {
    const items = [laptop];
    const original = [...items];

    calculateCategoryTotals(items);

    expect(items).toEqual(original);
  });
});

describe('processStockMovement', () => {
  it('increases stock and creates a stock-in movement', () => {
    const result = processStockMovement(
      laptop,
      'IN',
      5,
      'New delivery',
      'movement-1',
      '2026-10-25T10:00:00.000Z',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.updatedItem.stock).toBe(13);
      expect(result.movement.type).toBe('IN');
      expect(result.movement.quantity).toBe(5);
    }
  });

  it('decreases stock and creates a stock-out movement', () => {
    const result = processStockMovement(
      laptop,
      'OUT',
      3,
      'Customer sale',
      'movement-2',
      '2026-10-25T10:00:00.000Z',
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.updatedItem.stock).toBe(5);
      expect(result.movement.type).toBe('OUT');
    }
  });

  it.each([0, -1, 1.5])('rejects invalid quantity %s', (quantity) => {
    const result = processStockMovement(
      laptop,
      'IN',
      quantity,
      'Test',
      'movement-3',
      '2026-10-25T10:00:00.000Z',
    );

    expect(result.success).toBe(false);
  });

  it('rejects stock-out exceeding available stock', () => {
    const result = processStockMovement(
      laptop,
      'OUT',
      9,
      'Customer sale',
      'movement-4',
      '2026-10-25T10:00:00.000Z',
    );

    expect(result.success).toBe(false);
    expect(laptop.stock).toBe(8);
  });

  it('does not modify the original item after a successful operation', () => {
    const result = processStockMovement(
      laptop,
      'IN',
      2,
      'New delivery',
      'movement-5',
      '2026-10-25T10:00:00.000Z',
    );

    expect(laptop.stock).toBe(8);

    if (result.success) {
      expect(result.updatedItem.stock).toBe(10);
    }
  });
});
