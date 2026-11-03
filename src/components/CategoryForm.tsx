import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema } from '../schemas/inventorySchemas';
import type { CategoryFormData } from '../schemas/inventorySchemas';
import type { Category } from '../types/inventory';

type CategoryFormProps = {
  category?: Category;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function CategoryForm({ category, onSubmit, onCancel, isSubmitting = false }: CategoryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      lowStockThreshold: category?.lowStockThreshold ?? 5,
    },
  });

  const handleSubmitCategory = async (data: CategoryFormData) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save category.');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitCategory)} noValidate className="dialog-form">
      {submitError && <div className="alert alert-error" role="alert">{submitError}</div>}
      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="category-name">
            Category Name <span className="required">*</span>
          </label>
          <input
            id="category-name"
            type="text"
            placeholder="e.g. Electronics"
            className={errors.name ? 'input-error' : ''}
            {...register('name')}
          />
          {errors.name && <span className="field-error" role="alert">{errors.name.message}</span>}
        </div>

        <div className="form-group full-width">
          <label htmlFor="category-description">Description</label>
          <textarea
            id="category-description"
            rows={3}
            placeholder="Describe the products in this category"
            className={errors.description ? 'input-error' : ''}
            {...register('description')}
          />
          {errors.description && (
            <span className="field-error" role="alert">{errors.description.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="category-threshold">
            Default Low-Stock Threshold <span className="required">*</span>
          </label>
          <input
            id="category-threshold"
            type="number"
            min="0"
            step="1"
            className={errors.lowStockThreshold ? 'input-error' : ''}
            {...register('lowStockThreshold', { valueAsNumber: true })}
          />
          {errors.lowStockThreshold && (
            <span className="field-error" role="alert">{errors.lowStockThreshold.message}</span>
          )}
        </div>
      </div>

      <div className="form-actions-modal">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : category ? 'Save Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;