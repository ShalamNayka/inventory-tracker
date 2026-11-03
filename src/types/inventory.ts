export type Item = {
  id: string;
  name: string;
  sku?: string;
  categoryId: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  lowStockThreshold?: number;
};

export type StockMovement = {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  createdAt: string;
};

export type NotificationType =
  | 'OUT_OF_STOCK'
  | 'LOW_STOCK'
  | 'STOCK_ALERT'
  | 'STOCK_UPDATED'
  | 'STOCK_RESTORED';

export type StockCondition = 'out-of-stock' | 'low-stock' | 'at-threshold' | 'healthy';

export type InventoryNotification = {
  id: string;
  itemId: string;
  itemName: string;
  type: NotificationType;
  condition: StockCondition;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

export type UserRole = 'admin' | 'viewer';

export type AuthUser = {
  username: string;
  role: UserRole;
};
