import { useState } from 'react';
import Header from '../components/Header';
import CategoryModal from '../components/CategoryModal';
import { useItems, useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../api/inventoryQueries';
import { useRole } from '../hooks/useRole';
import { calculateCategoryTotals } from '../utils/inventoryRules';
import type { Category } from '../types/inventory';
import type { CategoryFormData } from '../schemas/inventorySchemas';

function CategoriesPage() {
  const { isAdmin } = useRole();
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: categories = [], isLoading: catsLoading, error: categoriesError } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totals = calculateCategoryTotals(items);
  const loading = itemsLoading || catsLoading;

  const openCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, updates: data });
        setFeedback({ type: 'success', text: `${data.name} was updated.` });
      } else {
        await createCategory.mutateAsync(data);
        setFeedback({ type: 'success', text: `${data.name} was created.` });
      }
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to save category.',
      });
      throw error;
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const assignedItems = items.filter((item) => item.categoryId === category.id);
    if (assignedItems.length > 0) {
      setFeedback({
        type: 'error',
        text: `Reassign ${assignedItems.length} product${assignedItems.length === 1 ? '' : 's'} before deleting ${category.name}.`,
      });
      return;
    }

    if (!window.confirm(`Delete the unused category "${category.name}"?`)) return;

    try {
      await deleteCategory.mutateAsync(category.id);
      setFeedback({ type: 'success', text: `${category.name} was deleted.` });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to delete category.',
      });
    }
  };

  return (
    <>
      <Header title="Categories & Department Stock" />

      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Categories Overview</h1>
            <p className="page-sub">
              Monitor inventory volumes, stock health, and items grouped by product category.
            </p>
          </div>
          <div className="category-page-actions">
            <span className="badge badge-info">{categories.length} categories active</span>
            {isAdmin && (
              <button type="button" className="btn-primary" onClick={openCreateModal}>
                + Add Category
              </button>
            )}
          </div>
        </div>

        {(categoriesError) && (
          <div className="alert alert-error" role="alert">
            Failed to load category data: {categoriesError.message}
          </div>
        )}

        {feedback && (
          <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`} role="status">
            {feedback.text}
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading category summaries...</p>
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🗂️</span>
            <h3>No categories found</h3>
            <p>No categories have been added yet.</p>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="table-wrap category-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Total Units</th>
                  <th>Default Threshold</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const productCount = items.filter((item) => item.categoryId === category.id).length;
                  return (
                    <tr key={category.id}>
                      <td className="category-table-name">{category.name}</td>
                      <td className="text-muted">{category.description || '—'}</td>
                      <td>{productCount}</td>
                      <td>{totals[category.id] ?? 0}</td>
                      <td>{category.lowStockThreshold ?? 5} units</td>
                      {isAdmin && (
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn-secondary btn-sm"
                              onClick={() => {
                                setEditingCategory(category);
                                setIsModalOpen(true);
                              }}
                              aria-label={`Edit ${category.name}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-danger btn-sm"
                              onClick={() => void handleDeleteCategory(category)}
                              disabled={productCount > 0 || deleteCategory.isPending}
                              title={productCount > 0 ? 'Reassign products before deleting' : undefined}
                              aria-label={`Delete ${category.name}`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen && isAdmin}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSaveCategory}
        category={editingCategory ?? undefined}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
      />
    </>
  );
}

export default CategoriesPage;
