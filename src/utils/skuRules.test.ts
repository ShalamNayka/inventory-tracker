import { describe, expect, it } from 'vitest';
import { itemSchema, editItemSchema } from '../schemas/inventorySchemas';
import type { Item } from '../types/inventory';
import { hasDuplicateSku, normalizeSku } from './skuRules';

const existingItems: Item[] = [
  {
    id: 'item-1',
    name: 'Keyboard',
    sku: 'ELEC-001',
    categoryId: 'cat-1',
    price: 100,
    stock: 5,
    lowStockThreshold: 2,
  },
];

describe('SKU validation', () => {
  it('trims and lowercases SKU values for comparison', () => {
    expect(normalizeSku('  Elec-001  ')).toBe('elec-001');
    expect(hasDuplicateSku(existingItems, ' elec-001 ')).toBe(true);
  });

  it('allows a new SKU and excludes the item being edited', () => {
    expect(hasDuplicateSku(existingItems, 'ELEC-002')).toBe(false);
    expect(hasDuplicateSku(existingItems, ' ELEC-001 ', 'item-1')).toBe(false);
  });

  it('requires a nonblank SKU and returns its trimmed value', () => {
    const formData = {
      name: 'New product',
      sku: '  ELEC-002 ',
      categoryId: 'cat-1',
      price: 100,
      stock: 5,
      lowStockThreshold: 2,
    };

    expect(itemSchema.parse(formData).sku).toBe('ELEC-002');
    expect(itemSchema.safeParse({ ...formData, sku: '  ' }).success).toBe(false);
    expect(editItemSchema.safeParse({ ...formData, stock: undefined }).success).toBe(true);
  });
});
