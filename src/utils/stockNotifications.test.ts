import { describe, expect, it } from 'vitest';
import { categorySchema } from '../schemas/inventorySchemas';
import type { InventoryNotification, Item } from '../types/inventory';
import {
  createRefreshedConditionNotifications,
  createStockChangeNotification,
  getStockCondition,
} from './stockNotifications';

const sampleItem: Item = {
  id: 'item-1',
  name: 'Wireless Mouse',
  categoryId: 'cat-1',
  price: 120,
  stock: 8,
  lowStockThreshold: 5,
};

describe('getStockCondition', () => {
  it.each([
    [0, 'out-of-stock'],
    [3, 'low-stock'],
    [5, 'low-stock'],
    [6, 'healthy'],
  ] as const)('classifies stock %s as %s', (stock, condition) => {
    expect(getStockCondition({ ...sampleItem, stock })).toBe(condition);
  });
});

describe('createStockChangeNotification', () => {
  it('creates an out-of-stock event when a movement reaches zero', () => {
    const notification = createStockChangeNotification(
      { ...sampleItem, stock: 1 },
      { ...sampleItem, stock: 0 },
      { type: 'OUT', quantity: 1 },
    );

    expect(notification?.type).toBe('OUT_OF_STOCK');
    expect(notification?.message).toContain('0 units remaining');
  });

  it('creates a restoration event when stock rises above its threshold', () => {
    const notification = createStockChangeNotification(
      { ...sampleItem, stock: 3 },
      { ...sampleItem, stock: 8 },
      { type: 'IN', quantity: 5 },
    );

    expect(notification?.type).toBe('STOCK_RESTORED');
  });

  it('creates a stock-updated event for replenishment while healthy', () => {
    const notification = createStockChangeNotification(
      { ...sampleItem, stock: 8 },
      { ...sampleItem, stock: 10 },
      { type: 'IN', quantity: 2 },
    );

    expect(notification?.type).toBe('STOCK_UPDATED');
    expect(notification?.message).toContain('received 2 new units');
  });

  it('records stock-in events while the item remains below threshold', () => {
    const notification = createStockChangeNotification(
      { ...sampleItem, stock: 2 },
      { ...sampleItem, stock: 3 },
      { type: 'IN', quantity: 1 },
    );

    expect(notification?.type).toBe('STOCK_UPDATED');
  });

  it('does not repeat an alert while the stock condition is unchanged', () => {
    const notification = createStockChangeNotification(
      { ...sampleItem, stock: 3 },
      { ...sampleItem, stock: 2 },
      { type: 'OUT', quantity: 1 },
    );

    expect(notification).toBeNull();
  });
});

describe('createRefreshedConditionNotifications', () => {
  it('creates one current alert and does not repeat it on later refreshes', () => {
    const lowStockItem = { ...sampleItem, stock: 3 };
    const first = createRefreshedConditionNotifications([lowStockItem], []);
    const savedNotification: InventoryNotification = { ...first[0], id: 'notice-1' };

    expect(first).toHaveLength(1);
    expect(first[0].type).toBe('LOW_STOCK');
    expect(createRefreshedConditionNotifications([lowStockItem], [savedNotification])).toEqual([]);
  });

  it('creates a low-stock alert at the threshold and recognizes legacy threshold alerts', () => {
    const atThresholdItem = { ...sampleItem, stock: sampleItem.lowStockThreshold };
    const alert = createRefreshedConditionNotifications([atThresholdItem], []);
    const legacyAlert: InventoryNotification = {
      id: 'legacy-notice',
      itemId: sampleItem.id,
      itemName: sampleItem.name,
      type: 'STOCK_ALERT',
      condition: 'at-threshold',
      title: 'Stock Alert',
      message: 'Wireless Mouse reached its low-stock threshold.',
      createdAt: '2026-10-25T10:00:00.000Z',
      isRead: false,
    };

    expect(alert[0].type).toBe('LOW_STOCK');
    expect(createRefreshedConditionNotifications([atThresholdItem], [legacyAlert])).toEqual([]);
  });

  it('creates a restored event if refreshed stock is now healthy', () => {
    const previousAlert: InventoryNotification = {
      id: 'notice-1',
      itemId: sampleItem.id,
      itemName: sampleItem.name,
      type: 'LOW_STOCK',
      condition: 'low-stock',
      title: 'Low Stock',
      message: 'Wireless Mouse has 3 units remaining.',
      createdAt: '2026-10-25T10:00:00.000Z',
      isRead: false,
    };

    expect(createRefreshedConditionNotifications([sampleItem], [previousAlert])[0].type).toBe(
      'STOCK_RESTORED',
    );
  });
});

describe('categorySchema', () => {
  it('accepts a name, description, and integer threshold', () => {
    expect(
      categorySchema.safeParse({
        name: 'Electronics',
        description: 'Devices and accessories',
        lowStockThreshold: 5,
      }).success,
    ).toBe(true);
  });

  it('rejects a negative or fractional low-stock threshold', () => {
    expect(
      categorySchema.safeParse({ name: 'Electronics', lowStockThreshold: -1 }).success,
    ).toBe(false);
    expect(
      categorySchema.safeParse({ name: 'Electronics', lowStockThreshold: 1.5 }).success,
    ).toBe(false);
  });
});