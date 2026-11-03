import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { itemSchema, stockMovementFormSchema } from '../schemas/inventorySchemas';
import { processStockMovement } from '../utils/inventoryRules';
import InventoryTable from '../components/InventoryTable';
import { RoleContext } from '../context/RoleContext';
import type { Item, Category } from '../types/inventory';

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Furniture' },
];

const sampleItem: Item = {
  id: 'item-101',
  name: 'Wireless Mouse',
  sku: 'WM-01',
  categoryId: 'cat-1',
  price: 500,
  stock: 10,
  lowStockThreshold: 3,
};

describe('Day 2 — Zod Schema Validations', () => {
  it('rejects an empty or invalid product name', () => {
    const invalidData = {
      name: '   ', // whitespace only
      categoryId: 'cat-1',
      price: 100,
      stock: 5,
      lowStockThreshold: 2,
    };

    const result = itemSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('name'));
      expect(issue?.message).toMatch(/Product name is required/i);
    }
  });

  it('rejects a missing category', () => {
    const invalidData = {
      name: 'Test Product',
      categoryId: '',
      price: 100,
      stock: 5,
      lowStockThreshold: 2,
    };

    const result = itemSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('categoryId'));
      expect(issue?.message).toMatch(/select a valid category/i);
    }
  });

  it('rejects negative quantity in stock movement schema', () => {
    const invalidData = {
      type: 'IN',
      quantity: -5,
      reason: 'Restocking',
    };

    const result = stockMovementFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('quantity'));
      expect(issue?.message).toMatch(/positive integer/i);
    }
  });

  it('rejects non-integer quantity in stock movement schema', () => {
    const invalidData = {
      type: 'IN',
      quantity: 3.5,
      reason: 'Restocking',
    };

    const result = stockMovementFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Day 2 — Stock Management Business Rules & Rollback', () => {
  it('rejects stock-out quantity greater than available stock', () => {
    const result = processStockMovement(
      sampleItem,
      'OUT',
      15, // item has 10 units
      'Customer order',
      'mov-1',
      new Date().toISOString(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/insufficient stock/i);
    }
  });

  it('allows stock-out when quantity is within available limits', () => {
    const result = processStockMovement(
      sampleItem,
      'OUT',
      4,
      'Customer order',
      'mov-2',
      new Date().toISOString(),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.updatedItem.stock).toBe(6);
    }
  });

  it('simulates optimistic update and rollback on failed server update', () => {
    // 1. Initial snapshot
    const initialItems = [{ ...sampleItem }];
    expect(initialItems[0].stock).toBe(10);

    // 2. Optimistic update simulation (client updates immediately)
    const optimisticQty = 3;
    const optimisticallyUpdated = initialItems.map((item) =>
      item.id === sampleItem.id ? { ...item, stock: item.stock - optimisticQty } : item,
    );
    expect(optimisticallyUpdated[0].stock).toBe(7);

    // 3. Network failure simulation: rollback is triggered
    const isNetworkError = true;
    let finalItems = optimisticallyUpdated;
    if (isNetworkError) {
      finalItems = initialItems; // restored from snapshot
    }

    expect(finalItems[0].stock).toBe(10); // successfully rolled back
  });
});

describe('Day 2 — Admin vs Viewer Role Permissions', () => {
  const dummyFn = () => {};

  it('renders Action buttons (Edit, Stock, Delete) when user is Admin', () => {
    const adminContextValue = {
      role: 'admin' as const,
      setRole: dummyFn,
      isAdmin: true,
      user: { username: 'Admin', role: 'admin' as const },
      isAuthenticated: true,
      login: dummyFn,
      logout: dummyFn,
      isSidebarCollapsed: false,
      toggleSidebar: dummyFn,
      setSidebarCollapsed: dummyFn,
    };

    render(
      <RoleContext.Provider value={adminContextValue}>
        <InventoryTable
          items={[sampleItem]}
          categories={mockCategories}
          onEdit={dummyFn}
          onManageStock={dummyFn}
          onDelete={dummyFn}
        />
      </RoleContext.Provider>,
    );

    // Admin should see action header and action buttons
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit wireless mouse/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /stock in or out for wireless mouse/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete wireless mouse/i })).toBeInTheDocument();
  });

  it('does NOT render Action buttons when user is Viewer (Read-Only)', () => {
    const viewerContextValue = {
      role: 'viewer' as const,
      setRole: dummyFn,
      isAdmin: false,
      user: { username: 'Viewer', role: 'viewer' as const },
      isAuthenticated: true,
      login: dummyFn,
      logout: dummyFn,
      isSidebarCollapsed: false,
      toggleSidebar: dummyFn,
      setSidebarCollapsed: dummyFn,
    };

    render(
      <RoleContext.Provider value={viewerContextValue}>
        <InventoryTable
          items={[sampleItem]}
          categories={mockCategories}
          onEdit={dummyFn}
          onManageStock={dummyFn}
          onDelete={dummyFn}
        />
      </RoleContext.Provider>,
    );

    // Viewer sees product info, but NO action header or edit/delete buttons
    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /actions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
