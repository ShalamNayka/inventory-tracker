import type {
  InventoryNotification,
  Item,
  NotificationType,
  StockCondition,
  StockMovement,
} from '../types/inventory';

type NotificationInput = Omit<InventoryNotification, 'id'>;

export function getStockCondition(item: Pick<Item, 'stock' | 'lowStockThreshold'>): StockCondition {
  if (item.stock === 0) return 'out-of-stock';
  if (item.stock < item.lowStockThreshold) return 'low-stock';
  if (item.stock === item.lowStockThreshold) return 'at-threshold';
  return 'healthy';
}

function conditionNotification(item: Item, condition: StockCondition): NotificationInput | null {
  const common = {
    itemId: item.id,
    itemName: item.name,
    condition,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  switch (condition) {
    case 'out-of-stock':
      return {
        ...common,
        type: 'OUT_OF_STOCK',
        title: 'Out of Stock',
        message: `${item.name} has 0 units remaining.`,
      };
    case 'low-stock':
      return {
        ...common,
        type: 'LOW_STOCK',
        title: 'Low Stock',
        message: `${item.name} has ${item.stock} units remaining (threshold ${item.lowStockThreshold}).`,
      };
    case 'at-threshold':
      return {
        ...common,
        type: 'STOCK_ALERT',
        title: 'Stock Alert',
        message: `${item.name} reached its low-stock threshold of ${item.lowStockThreshold} units.`,
      };
    case 'healthy':
      return null;
  }
}

export function createStockChangeNotification(
  previousItem: Item,
  updatedItem: Item,
  movement: Pick<StockMovement, 'type' | 'quantity'>,
): NotificationInput | null {
  const previousCondition = getStockCondition(previousItem);
  const condition = getStockCondition(updatedItem);

  if (condition !== previousCondition) {
    if (condition === 'healthy' && previousCondition !== 'healthy') {
      return {
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        type: 'STOCK_RESTORED',
        condition,
        title: 'Stock Restored',
        message: `${updatedItem.name} stock is replenished to ${updatedItem.stock} units.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
    }
    return conditionNotification(updatedItem, condition);
  }

  if (movement.type === 'IN') {
    return {
      itemId: updatedItem.id,
      itemName: updatedItem.name,
      type: 'STOCK_UPDATED',
      condition,
      title: 'Stock Updated',
      message: `${updatedItem.name} received ${movement.quantity} new units.`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
  }

  return null;
}

function latestConditions(notifications: InventoryNotification[]): Map<string, StockCondition> {
  const latest = new Map<string, { condition: StockCondition; createdAt: string }>();

  for (const notification of notifications) {
    const previous = latest.get(notification.itemId);
    if (!previous || notification.createdAt >= previous.createdAt) {
      latest.set(notification.itemId, {
        condition: notification.condition,
        createdAt: notification.createdAt,
      });
    }
  }

  return new Map([...latest].map(([itemId, state]) => [itemId, state.condition]));
}

export function createRefreshedConditionNotifications(
  items: Item[],
  notifications: InventoryNotification[],
): NotificationInput[] {
  const knownConditions = latestConditions(notifications);

  return items.flatMap((item) => {
    const currentCondition = getStockCondition(item);
    const previousCondition = knownConditions.get(item.id);

    if (currentCondition === previousCondition) return [];
    if (currentCondition === 'healthy') {
      if (!previousCondition || previousCondition === 'healthy') return [];
      return [{
        itemId: item.id,
        itemName: item.name,
        type: 'STOCK_RESTORED' as NotificationType,
        condition: currentCondition,
        title: 'Stock Restored',
        message: `${item.name} stock is replenished to ${item.stock} units.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      }];
    }

    return [conditionNotification(item, currentCondition)!];
  });
}