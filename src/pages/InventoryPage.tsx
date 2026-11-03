import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Modal from '../components/Modal';
import InventoryFilters from '../components/InventoryFilters';
import InventoryTable from '../components/InventoryTable';
import ItemForm from '../components/ItemForm';
import EditItemForm from '../components/EditItemForm';
import StockMovementForm from '../components/StockMovementForm';
import CategoryModal from '../components/CategoryModal';
import { useRole } from '../hooks/useRole';
import {
  useItems,
  useCategories,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useCreateCategory,
  useStockMovementMutation,
} from '../api/inventoryQueries';
import type { Category, Item, StockMovement } from '../types/inventory';
import type { CategoryFormData, EditItemFormData, ItemFormData } from '../schemas/inventorySchemas';

type SortOrder = 'asc' | 'desc';

function InventoryPage() {
  const { isAdmin } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const notificationItemId = searchParams.get('item');

  // ─── Server State (TanStack Query) ──────────────────────────────────────────
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useItems();
  const { data: categories = [], isLoading: catsLoading } = useCategories();

  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();
  const createCategoryMutation = useCreateCategory();
  const stockMovementMutation = useStockMovementMutation();

  // ─── UI State (React useState) ──────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modal dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickCategoryModalOpen, setIsQuickCategoryModalOpen] = useState(false);
  const [createdCategory, setCreatedCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [stockItem, setStockItem] = useState<Item | null>(null);

  // User feedback alerts
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const notificationItem = items.find((item) => item.id === notificationItemId);
  const activeSearch = notificationItem?.name ?? search;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─── Derived Client-Side Filtering & Sorting ────────────────────────────────
  const visibleItems = useMemo(() => {
    const q = activeSearch.trim().toLowerCase();
    return items
      .filter((item) => {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSku = item.sku ? item.sku.toLowerCase().includes(q) : false;
        return matchesName || matchesSku;
      })
      .filter((item) => selectedCategory === 'all' || item.categoryId === selectedCategory)
      .toSorted((a, b) => (sortOrder === 'asc' ? a.stock - b.stock : b.stock - a.stock));
  }, [items, activeSearch, selectedCategory, sortOrder]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (notificationItemId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('item');
      setSearchParams(nextParams, { replace: true });
    }
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateProduct = async (formData: ItemFormData) => {
    try {
      const created = await createItemMutation.mutateAsync({
        name: formData.name,
        sku: formData.sku || undefined,
        categoryId: formData.categoryId,
        price: formData.price,
        stock: formData.stock,
        lowStockThreshold: formData.lowStockThreshold,
      });

      setIsAddModalOpen(false);
      showToast(`Product "${created.name}" created successfully!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create product', 'error');
    }
  };

  const handleCreateQuickCategory = async (formData: CategoryFormData) => {
    const category = await createCategoryMutation.mutateAsync(formData);
    setCreatedCategory(category);
    setIsQuickCategoryModalOpen(false);
    showToast(`Category "${category.name}" created and selected.`);
  };

  const handleUpdateProduct = async (id: string, formData: EditItemFormData) => {
    try {
      const updated = await updateItemMutation.mutateAsync({
        id,
        updates: {
          name: formData.name,
          sku: formData.sku || undefined,
          categoryId: formData.categoryId,
          price: formData.price,
          lowStockThreshold: formData.lowStockThreshold,
        },
      });

      setEditingItem(null);
      showToast(`Product "${updated.name}" updated successfully!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = async (item: Item) => {
    if (!isAdmin) {
      showToast('Permission denied. Only admins can delete products.', 'error');
      return;
    }

    try {
      await deleteItemMutation.mutateAsync(item.id);
      showToast(`Product "${item.name}" was permanently deleted.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete product', 'error');
    }
  };

  const handleStockMovement = async (
    type: StockMovement['type'],
    quantity: number,
    reason: string,
  ) => {
    if (!stockItem) return;

    try {
      await stockMovementMutation.mutateAsync({
        item: stockItem,
        type,
        quantity,
        reason,
      });

      setStockItem(null);
      showToast(
        `${type === 'IN' ? 'Restocked' : 'Stocked out'} ${quantity} unit(s) of "${stockItem.name}".`,
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? `Stock movement failed (rolled back): ${err.message}`
          : 'Stock movement failed and was rolled back.',
        'error',
      );
    }
  };

  const isLoading = itemsLoading || catsLoading;

  return (
    <>
      <Header title="Inventory Catalog" />

      <div className="page">
        {/* Page Top Actions */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Products Inventory</h1>
            <p className="page-sub">
              {isAdmin
                ? 'Full administrative control: manage products, track SKUs, and handle stock movements.'
                : 'Viewing inventory in read-only mode.'}
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="btn-primary btn-add-product"
              onClick={() => {
                setCreatedCategory(null);
                setIsAddModalOpen(true);
              }}
            >
              + Add Product
            </button>
          )}
        </div>

        {/* Global Toast Feedback Banner */}
        {toastMessage && (
          <div
            className={`alert ${toastMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}
            role="status"
          >
            {toastMessage.type === 'success' ? '✓ ' : '⚠️ '}
            {toastMessage.text}
          </div>
        )}

        {/* Server Fetch Error */}
        {itemsError && (
          <div className="alert alert-error" role="alert">
            Failed to connect to API server: {itemsError.message}. Make sure json-server is running
            on port 3001.
          </div>
        )}

        {/* Search, Filter & Sort Controls */}
        <InventoryFilters
          search={activeSearch}
          selectedCategory={selectedCategory}
          sortOrder={sortOrder}
          categories={categories}
          onSearchChange={handleSearchChange}
          onCategoryChange={setSelectedCategory}
          onSortChange={setSortOrder}
          onReset={() => {
            setSearch('');
            if (notificationItemId) setSearchParams({}, { replace: true });
            setSelectedCategory('all');
            setSortOrder('asc');
          }}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading catalog items...</p>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && (
          <>
            <InventoryTable
              items={visibleItems}
              categories={categories}
              onEdit={(item) => setEditingItem(item)}
              onManageStock={(item) => setStockItem(item)}
              onDelete={handleDeleteProduct}
            />

            <div className="table-footer-info">
              <span>
                Showing <strong>{visibleItems.length}</strong> of <strong>{items.length}</strong>{' '}
                total products
              </span>
              {activeSearch && (
                <span className="search-active-pill">Filtered by: &quot;{activeSearch}&quot;</span>
              )}
            </div>
          </>
        )}

        {/* ─── ADD PRODUCT MODAL POPUP ───────────────────────────────────────── */}
        <Modal
          isOpen={isAddModalOpen && isAdmin}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Product"
          maxWidth="600px"
        >
          <ItemForm
            categories={categories}
            onSubmit={handleCreateProduct}
            onRequestCreateCategory={() => setIsQuickCategoryModalOpen(true)}
            createdCategory={createdCategory}
            onCancel={() => setIsAddModalOpen(false)}
            isSubmitting={createItemMutation.isPending}
          />
        </Modal>

        <CategoryModal
          isOpen={isQuickCategoryModalOpen && isAdmin}
          onClose={() => setIsQuickCategoryModalOpen(false)}
          onSubmit={handleCreateQuickCategory}
          isSubmitting={createCategoryMutation.isPending}
        />

        {/* ─── EDIT PRODUCT MODAL POPUP ──────────────────────────────────────── */}
        <Modal
          isOpen={Boolean(editingItem) && isAdmin}
          onClose={() => setEditingItem(null)}
          title={editingItem ? `Edit "${editingItem.name}"` : 'Edit Product'}
          maxWidth="600px"
        >
          {editingItem && (
            <EditItemForm
              item={editingItem}
              categories={categories}
              onSave={handleUpdateProduct}
              onCancel={() => setEditingItem(null)}
              isSaving={updateItemMutation.isPending}
            />
          )}
        </Modal>

        {/* ─── STOCK MOVEMENT MODAL POPUP ────────────────────────────────────── */}
        <Modal
          isOpen={Boolean(stockItem) && isAdmin}
          onClose={() => setStockItem(null)}
          title={stockItem ? `Stock Movement: ${stockItem.name}` : 'Stock Movement'}
          maxWidth="550px"
        >
          {stockItem && (
            <StockMovementForm
              item={stockItem}
              onSubmit={handleStockMovement}
              onCancel={() => setStockItem(null)}
              isSubmitting={stockMovementMutation.isPending}
            />
          )}
        </Modal>
      </div>
    </>
  );
}

export default InventoryPage;
