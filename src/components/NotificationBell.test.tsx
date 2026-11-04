import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InventoryNotification } from '../types/inventory';
import NotificationBell from './NotificationBell';

const mocks = vi.hoisted(() => ({
  result: undefined as unknown,
  mutate: vi.fn(),
}));

vi.mock('../api/inventoryQueries', () => ({
  useNotifications: () => mocks.result,
  useMarkNotificationsRead: () => ({ mutate: mocks.mutate, isPending: false }),
}));

vi.mock('../hooks/useRole', () => ({
  useRole: () => ({ isAdmin: false }),
}));

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function makeNotification(
  id: string,
  type: InventoryNotification['type'],
  title: string,
  itemId = 'item-1',
): InventoryNotification {
  return {
    id,
    itemId,
    itemName: 'Wireless Mouse',
    type,
    condition: type === 'STOCK_RESTORED' ? 'healthy' : 'low-stock',
    title,
    message: `${title} for Wireless Mouse`,
    createdAt: '2026-11-04T10:00:00.000Z',
    isRead: false,
  };
}

function renderBell() {
  return render(
    <MemoryRouter initialEntries={['/overview']}>
      <NotificationBell />
      <CurrentLocation />
    </MemoryRouter>,
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows unread alerts to viewers and opens the affected product from a new-alert toast', async () => {
    const initialNotifications = [
      makeNotification('low-1', 'LOW_STOCK', 'Low Stock'),
      makeNotification('restored-1', 'STOCK_RESTORED', 'Stock Restored'),
      makeNotification('movement-1', 'STOCK_UPDATED', 'Stock Updated'),
    ];
    mocks.result = { data: initialNotifications, isLoading: false, error: null };
    const view = renderBell();

    expect(screen.getByRole('button', { name: 'Notifications, 2 unread' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 2 unread' }));
    const panel = screen.getByRole('region', { name: 'Notifications' });
    expect(within(panel).getByText('Stock Restored')).toBeInTheDocument();
    expect(within(panel).queryByText('Stock Updated')).not.toBeInTheDocument();

    const newAlert = makeNotification('out-1', 'OUT_OF_STOCK', 'Out of Stock', 'item-2');
    mocks.result = {
      data: [newAlert, ...initialNotifications],
      isLoading: false,
      error: null,
    };
    view.rerender(
      <MemoryRouter initialEntries={['/overview']}>
        <NotificationBell />
        <CurrentLocation />
      </MemoryRouter>,
    );

    const toast = await waitFor(() => {
      const element = view.container.querySelector<HTMLElement>('.notification-toast');
      if (!element) throw new Error('Expected the new-alert toast to appear.');
      return element;
    });
    const toastButton = within(toast).getByRole('button', {
      name: /Out of Stock for Wireless Mouse/,
    });
    fireEvent.click(toastButton);

    expect(screen.getByTestId('location')).toHaveTextContent('/inventory?item=item-2');
  });
});
