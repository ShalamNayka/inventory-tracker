import { useEffect, useMemo, useState } from 'react';

import {
  createItem,
  createStockMovement,
  deleteItem,
  getCategories,
  getItems,
  getStockMovements,
  updateItem,
  updateItemStock,
} from '../api/inventoryApi';

import type { Category, Item, StockMovement } from '../types/inventory';

import { calculateCategoryTotals, isLowStock, processStockMovement } from '../utils/inventoryRules';

import EditItemForm from './EditItemForm';
import InventoryFilters from './InventoryFilters';
import InventoryTable from './InventoryTable';
import ItemForm from './ItemForm';
import StockMovementForm from './StockMovementForm';
import { useRole } from '../hooks/useRole';

type SortOrder = 'asc' | 'desc';

function InventoryDashboard() {
  const { role, setRole, isAdmin } = useRole();

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [stockItemId, setStockItemId] = useState<string | null>(null);

  const editingItem = items.find((item) => item.id === editingItemId);
  const stockItem = items.find((item) => item.id === stockItemId);

  // Load inventory, categories, and movement history.
  useEffect(() => {
    const controller = new AbortController();

    async function loadInventory() {
      try {
        setLoading(true);
        setError(null);

        const [loadedItems, loadedCategories, loadedMovements] = await Promise.all([
          getItems(controller.signal),
          getCategories(controller.signal),
          getStockMovements(controller.signal),
        ]);

        setItems(loadedItems);
        setCategories(loadedCategories);
        setMovements(loadedMovements);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unable to load inventory.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadInventory();

    return () => controller.abort();
  }, []);

  // Search, category filtering, and sorting are derived from current items.
  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items
      .filter((item) => item.name.toLowerCase().includes(normalizedSearch))
      .filter((item) => selectedCategory === 'all' || item.categoryId === selectedCategory)
      .toSorted((first, second) =>
        sortOrder === 'asc' ? first.stock - second.stock : second.stock - first.stock,
      );
  }, [items, search, selectedCategory, sortOrder]);

  const categoryTotals = useMemo(() => calculateCategoryTotals(items), [items]);

  async function handleCreateItem(newItem: Omit<Item, 'id'>): Promise<void> {
    setError(null);
    setSuccessMessage('');

    const createdItem = await createItem(newItem);

    setItems((currentItems) => [...currentItems, createdItem]);
    setShowItemForm(false);
    setSuccessMessage(`${createdItem.name} was added successfully.`);
  }

  async function handleUpdateItem(
    id: string,
    updates: Pick<Item, 'name' | 'categoryId' | 'price' | 'lowStockThreshold'>,
  ): Promise<void> {
    setError(null);
    setSuccessMessage('');

    const updatedItem = await updateItem(id, updates);

    setItems((currentItems) => currentItems.map((item) => (item.id === id ? updatedItem : item)));

    setEditingItemId(null);
    setSuccessMessage(`${updatedItem.name} was updated successfully.`);
  }

  async function handleDeleteItem(item: Item): Promise<void> {
    if (!isAdmin) {
      setError('Only admins can delete products.');
      return;
    }

    setError(null);
    setSuccessMessage('');

    await deleteItem(item.id);

    setItems((currentItems) => currentItems.filter((i) => i.id !== item.id));
    setSuccessMessage(`${item.name} was deleted.`);
  }

  async function handleStockMovement(
    type: StockMovement['type'],
    quantity: number,
    reason: string,
  ): Promise<void> {
    setError(null);
    setSuccessMessage('');

    const currentItem = items.find((item) => item.id === stockItemId);

    if (!currentItem) {
      throw new Error('The selected product could not be found.');
    }

    // Apply the business rules before making any API requests.
    const result = processStockMovement(
      currentItem,
      type,
      quantity,
      reason,
      crypto.randomUUID(),
      new Date().toISOString(),
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    // First update stock in the API.
    const updatedItem = await updateItemStock(currentItem.id, result.updatedItem.stock);

    // Then create the movement record.
    let createdMovement: StockMovement;

    try {
      const movementWithoutId = {
  itemId: result.movement.itemId,
  type: result.movement.type,
  quantity: result.movement.quantity,
  reason: result.movement.reason,
  createdAt: result.movement.createdAt,
};

createdMovement = await createStockMovement(movementWithoutId);
    } catch {
      // Best-effort rollback if recording the movement fails.
      try {
        await updateItemStock(currentItem.id, currentItem.stock);
      } catch {
        throw new Error(
          'Movement recording and stock rollback both failed. ' +
            'Please check the product stock and movement history in the API.',
        );
      }

      throw new Error(
        'The movement could not be recorded. The stock rollback succeeded; please retry.',
      );
    }

    // Update React state only after both API requests succeed.
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );

    setMovements((currentMovements) => [createdMovement, ...currentMovements]);

    setStockItemId(null);

    setSuccessMessage(
      `${type === 'IN' ? 'Stock added to' : 'Stock removed from'} ` +
        `${updatedItem.name}. Current stock: ${updatedItem.stock} units.`,
    );
  }

  if (loading) {
    return <p role="status">Loading inventory...</p>;
  }

  if (error && items.length === 0) {
    return (
      <div role="alert">
        <p>Failed to load inventory: {error}</p>

        <button type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Inventory Tracker</h1>
          <p>Manage products and monitor stock levels.</p>
        </div>

        {/* Role switcher – uses React Context */}
        <div className="role-switcher">
          <label htmlFor="role-select">
            <strong>Role:</strong>
          </label>
          <select
            id="role-select"
            value={role}
            onChange={(event) => setRole(event.target.value as 'admin' | 'viewer')}
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <span className={`role-badge role-badge--${role}`}>
            {isAdmin ? '🔑 Admin' : '👁 Viewer'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setSuccessMessage('');
            setError(null);
            setEditingItemId(null);
            setStockItemId(null);
            setShowItemForm((current) => !current);
          }}
        >
          {showItemForm ? 'Close Form' : 'Add Product'}
        </button>
      </header>

      {successMessage && <p role="status">{successMessage}</p>}
      {error && <p role="alert">{error}</p>}

      {showItemForm && (
        <ItemForm
          categories={categories}
          onSubmit={handleCreateItem}
          onCancel={() => setShowItemForm(false)}
        />
      )}

      {editingItem && (
        <EditItemForm
          key={editingItem.id}
          item={editingItem}
          categories={categories}
          onSave={handleUpdateItem}
          onCancel={() => setEditingItemId(null)}
        />
      )}

      {stockItem && (
        <StockMovementForm
          key={stockItem.id}
          item={stockItem}
          onSubmit={handleStockMovement}
          onCancel={() => setStockItemId(null)}
        />
      )}

      <section className="summary-grid" aria-label="Inventory summary">
        <article className="summary-card">
          <h2>Total Products</h2>
          <p>{items.length}</p>
        </article>

        <article className="summary-card">
          <h2>Low-Stock Products</h2>
          <p>{items.filter(isLowStock).length}</p>
        </article>

        <article className="summary-card">
          <h2>Categories</h2>
          <p>{categories.length}</p>
        </article>
      </section>

      <section aria-label="Stock totals by category">
        <h2>Stock by Category</h2>

        {categories.length === 0 ? (
          <p>No categories available.</p>
        ) : (
          <ul>
            {categories.map((category) => (
              <li key={category.id}>
                {category.name}: {categoryTotals[category.id] ?? 0} units
              </li>
            ))}
          </ul>
        )}
      </section>

      <InventoryFilters
        search={search}
        selectedCategory={selectedCategory}
        sortOrder={sortOrder}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setSelectedCategory}
        onSortChange={setSortOrder}
      />

      <InventoryTable
        items={visibleItems}
        categories={categories}
        onEdit={(item) => {
          setError(null);
          setSuccessMessage('');
          setShowItemForm(false);
          setStockItemId(null);
          setEditingItemId(item.id);
        }}
        onManageStock={(item) => {
          setError(null);
          setSuccessMessage('');
          setShowItemForm(false);
          setEditingItemId(null);
          setStockItemId(item.id);
        }}
        onDelete={(item) => {
          setError(null);
          setSuccessMessage('');
          void handleDeleteItem(item);
        }}
      />

      <section aria-label="Stock movement history">
        <h2>Stock Movement History</h2>

        {movements.length === 0 ? (
          <p>No stock movements recorded yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Type</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>

              <tbody>
                {movements.map((movement) => {
                  const movementItem = items.find((item) => item.id === movement.itemId);

                  return (
                    <tr key={movement.id}>
                      <td>{movementItem?.name ?? 'Unknown product'}</td>
                      <td>{movement.type === 'IN' ? 'Stock In' : 'Stock Out'}</td>
                      <td>{movement.quantity}</td>
                      <td>{movement.reason}</td>
                      <td>{new Date(movement.createdAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default InventoryDashboard;
