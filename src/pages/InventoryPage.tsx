import { useMemo, useState } from 'react';
import Header from '../components/Header';
import InventoryFilters from '../components/InventoryFilters';
import InventoryTable from '../components/InventoryTable';
import ItemForm from '../components/ItemForm';
import EditItemForm from '../components/EditItemForm';
import StockMovementForm from '../components/StockMovementForm';
import { useRole } from '../hooks/useRole';
import { useInventoryData } from '../hooks/useInventoryDataHook';
import { processStockMovement } from '../utils/inventoryRules';
import {
  createItem,
  updateItem,
  deleteItem,
  updateItemStock,
  createStockMovement,
} from '../api/inventoryApi';
import type { Item, StockMovement } from '../types/inventory';

type SortOrder = 'asc' | 'desc';

function InventoryPage() {
  const { isAdmin } = useRole();
  const { items, setItems, categories, setMovements, loading, error } = useInventoryData();

  const [search, setSearch]                   = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder]             = useState<SortOrder>('asc');
  const [successMsg, setSuccessMsg]           = useState('');
  const [localError, setLocalError]           = useState('');

  const [showAddForm, setShowAddForm]     = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [stockItemId, setStockItemId]     = useState<string | null>(null);

  const editingItem = items.find((i) => i.id === editingItemId);
  const stockItem   = items.find((i) => i.id === stockItemId);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => i.name.toLowerCase().includes(q))
      .filter((i) => selectedCategory === 'all' || i.categoryId === selectedCategory)
      .toSorted((a, b) => sortOrder === 'asc' ? a.stock - b.stock : b.stock - a.stock);
  }, [items, search, selectedCategory, sortOrder]);

  function flash(msg: string) {
    setSuccessMsg(msg);
    setLocalError('');
    setTimeout(() => setSuccessMsg(''), 3500);
  }
  function flashErr(msg: string) { setLocalError(msg); setSuccessMsg(''); }

  async function handleCreate(newItem: Omit<Item, 'id'>) {
    const created = await createItem(newItem);
    setItems((prev) => [...prev, created]);
    setShowAddForm(false);
    flash(`${created.name} added.`);
  }

  async function handleUpdate(id: string, updates: Pick<Item, 'name' | 'categoryId' | 'price' | 'lowStockThreshold'>) {
    const updated = await updateItem(id, updates);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setEditingItemId(null);
    flash(`${updated.name} updated.`);
  }

  async function handleDelete(item: Item) {
    if (!isAdmin) { flashErr('Only admins can delete products.'); return; }
    await deleteItem(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    flash(`${item.name} deleted.`);
  }

  async function handleStockMovement(type: StockMovement['type'], quantity: number, reason: string) {
    const current = items.find((i) => i.id === stockItemId);
    if (!current) throw new Error('Product not found.');

    const result = processStockMovement(current, type, quantity, reason, crypto.randomUUID(), new Date().toISOString());
    if (!result.success) throw new Error(result.error);

    const updatedItem = await updateItemStock(current.id, result.updatedItem.stock);

    let createdMovement: StockMovement;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _movId, ...movementBody } = result.movement;
      createdMovement = await createStockMovement(movementBody);
    } catch {
      await updateItemStock(current.id, current.stock).catch(() => null);
      throw new Error('Movement recording failed. Stock rolled back.');
    }

    setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    setMovements((prev) => [createdMovement, ...prev]);
    setStockItemId(null);
    flash(`${type === 'IN' ? 'Added to' : 'Removed from'} ${updatedItem.name}. Stock: ${updatedItem.stock}`);
  }

  return (
    <>
      <Header title="Inventory" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Products</h1>
          {isAdmin && (
            <button
              className="btn-primary"
              onClick={() => { setShowAddForm((v) => !v); setEditingItemId(null); setStockItemId(null); }}
            >
              {showAddForm ? '✕ Close' : '+ Add Product'}
            </button>
          )}
        </div>

        {successMsg  && <p className="alert alert-success">{successMsg}</p>}
        {(localError || error) && <p className="alert alert-error">{localError || error}</p>}

        {showAddForm && isAdmin && (
          <div className="form-panel">
            <ItemForm
              categories={categories}
              onSubmit={handleCreate}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {editingItem && (
          <div className="form-panel">
            <EditItemForm
              key={editingItem.id}
              item={editingItem}
              categories={categories}
              onSave={handleUpdate}
              onCancel={() => setEditingItemId(null)}
            />
          </div>
        )}

        {stockItem && (
          <div className="form-panel">
            <StockMovementForm
              key={stockItem.id}
              item={stockItem}
              onSubmit={handleStockMovement}
              onCancel={() => setStockItemId(null)}
            />
          </div>
        )}

        <InventoryFilters
          search={search}
          selectedCategory={selectedCategory}
          sortOrder={sortOrder}
          categories={categories}
          onSearchChange={setSearch}
          onCategoryChange={setSelectedCategory}
          onSortChange={setSortOrder}
        />

        {loading ? (
          <div className="loading">Loading products…</div>
        ) : (
          <InventoryTable
            items={visibleItems}
            categories={categories}
            onEdit={(item) => { setEditingItemId(item.id); setShowAddForm(false); setStockItemId(null); }}
            onManageStock={(item) => { setStockItemId(item.id); setShowAddForm(false); setEditingItemId(null); }}
            onDelete={(item) => { void handleDelete(item); }}
          />
        )}

        <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: '.8rem' }}>
          Showing {visibleItems.length} of {items.length} products
        </p>
      </div>
    </>
  );
}

export default InventoryPage;
