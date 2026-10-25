export type Item = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
};

export type Category = {
  id: string;
  name: string;
};

export type StockMovement = {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  createdAt: string;
};

export type UserRole = 'admin' | 'viewer';
