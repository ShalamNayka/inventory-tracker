import { useEffect, useMemo, useState } from 'react';

import { createItem, getCategories, getItems, updateItem } from '../api/inventoryApi';

import type { Category, Item } from '../types/inventory';

import { calculateCategoryTotals, isLowStock } from '../utils/inventoryRules';

import EditItemForm from './EditItemForm';
import InventoryFilters from './InventoryFilters';
import InventoryTable from './InventoryTable';
import ItemForm from './ItemForm';

type SortOrder = 'asc' | 'desc';

function InventoryDashboard() {
  // Inventory data
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Search, category filtering, and sorting
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Loading and messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Form visibility
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Load inventory and categories when the component mounts
  useEffect(() => {
    const controller = new AbortController();

    async function loadInventory() {
      try {
        setLoading(true);
        setError(null);

        const [loadedItems, loadedCategories] = await Promise.all([
          getItems(controller.signal),
          getCategories(controller.signal),
        ]);

        setItems(loadedItems);
        setCategories(loadedCategories);
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

    return () => {
      controller.abort();
    };
  }, []);

  // Find the product currently selected for editing
  const editingItem = items.find((item) => item.id === editingItemId);

  // Derive visible products from the current search and filter settings
  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items
      .filter((item) => item.name.toLowerCase().includes(normalizedSearch))
      .filter((item) => selectedCategory === 'all' || item.categoryId === selectedCategory)
      .toSorted((first, second) =>
        sortOrder === 'asc' ? first.stock - second.stock : second.stock - first.stock,
      );
  }, [items, search, selectedCategory, sortOrder]);

  // Calculate stock totals by category without storing duplicate data
  const categoryTotals = useMemo(() => calculateCategoryTotals(items), [items]);

  // Create a product through the API
  async function handleCreateItem(newItem: Omit<Item, 'id'>): Promise<void> {
    setError(null);
    setSuccessMessage('');

    const createdItem = await createItem(newItem);

    setItems((currentItems) => [...currentItems, createdItem]);
    setShowItemForm(false);

    setSuccessMessage(`${createdItem.name} was added successfully.`);
  }

  // Update the editable product fields through the API
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

        <button
          type="button"
          onClick={() => {
            setSuccessMessage('');
            setError(null);
            setEditingItemId(null);
            setShowItemForm((current) => !current);
          }}
        >
          {showItemForm ? 'Close Form' : 'Add Product'}
        </button>
      </header>

      {successMessage && <p role="status">{successMessage}</p>}

      {error && <p role="alert">{error}</p>}

      {/* Create product form */}
      {showItemForm && (
        <ItemForm
          categories={categories}
          onSubmit={handleCreateItem}
          onCancel={() => setShowItemForm(false)}
        />
      )}

      {/* Edit product form */}
      {editingItem && (
        <EditItemForm
          key={editingItem.id}
          item={editingItem}
          categories={categories}
          onSave={handleUpdateItem}
          onCancel={() => setEditingItemId(null)}
        />
      )}

      {/* Inventory summary */}
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

      {/* Derived stock totals */}
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

      {/* Search, filter, and sort controls */}
      <InventoryFilters
        search={search}
        selectedCategory={selectedCategory}
        sortOrder={sortOrder}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setSelectedCategory}
        onSortChange={setSortOrder}
      />

      {/* Product table */}
      <InventoryTable
        items={visibleItems}
        categories={categories}
        onEdit={(item) => {
          setError(null);
          setSuccessMessage('');
          setShowItemForm(false);
          setEditingItemId(item.id);
        }}
      />
    </main>
  );
}

export default InventoryDashboard;
