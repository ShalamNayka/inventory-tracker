import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ItemForm from '../components/ItemForm';
import { itemSchema } from './inventorySchemas';

const validItem = {
  name: 'Keyboard',
  sku: 'KEY-001',
  categoryId: 'cat-1',
  price: 1,
  stock: 0,
  lowStockThreshold: 0,
};

describe('itemSchema required numeric fields', () => {
  it('rejects missing and empty numeric values without coercing them to zero', () => {
    expect(itemSchema.safeParse({ ...validItem, price: undefined }).success).toBe(false);
    expect(itemSchema.safeParse({ ...validItem, price: Number.NaN }).success).toBe(false);
    expect(itemSchema.safeParse({ ...validItem, stock: Number.NaN }).success).toBe(false);
    expect(itemSchema.safeParse({ ...validItem, lowStockThreshold: Number.NaN }).success).toBe(
      false,
    );
  });

  it('requires a positive price and nonnegative stock and threshold', () => {
    expect(itemSchema.safeParse({ ...validItem, price: 0 }).success).toBe(false);
    expect(itemSchema.safeParse({ ...validItem, price: -1 }).success).toBe(false);
    expect(itemSchema.safeParse({ ...validItem, stock: -1 }).success).toBe(false);
    expect(itemSchema.safeParse({ ...validItem, lowStockThreshold: -1 }).success).toBe(false);
    expect(itemSchema.safeParse(validItem).success).toBe(true);
  });
});

describe('ItemForm numeric input handling', () => {
  it('shows required errors for initially empty numeric fields and does not submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ItemForm
        categories={[{ id: 'cat-1', name: 'Electronics' }]}
        items={[]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Add Product' }).closest('form')!);

    expect(await screen.findByText('Unit price is required')).toBeInTheDocument();
    expect(screen.getByText('Initial stock is required')).toBeInTheDocument();
    expect(screen.getByText('Threshold is required')).toBeInTheDocument();
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });
});
