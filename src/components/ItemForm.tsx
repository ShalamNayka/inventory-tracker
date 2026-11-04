import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemSchema } from '../schemas/inventorySchemas';
import type { ItemFormData } from '../schemas/inventorySchemas';
import type { Category, Item } from '../types/inventory';
import { hasDuplicateSku } from '../utils/skuRules';

type ItemFormProps = {
  categories: Category[];
  items: Item[];
  onSubmit: (data: ItemFormData) => Promise<void>;
  onRequestCreateCategory?: () => void;
  createdCategory?: Category | null;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function ItemForm({
  categories,
  items,
  onSubmit,
  onRequestCreateCategory,
  createdCategory,
  onCancel,
  isSubmitting = false,
}: ItemFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: '',
    },
  });

  useEffect(() => {
    if (createdCategory) {
      setValue('categoryId', createdCategory.id, { shouldValidate: true });
      if (createdCategory.lowStockThreshold !== undefined) {
        setValue('lowStockThreshold', createdCategory.lowStockThreshold);
      }
    }
  }, [createdCategory, setValue]);

  const onFormSubmit = async (data: ItemFormData) => {
    clearErrors('sku');
    if (hasDuplicateSku(items, data.sku)) {
      setError('sku', { type: 'manual', message: 'This SKU already exists' });
      return;
    }
    if (!categories.some((category) => category.id === data.categoryId)) {
      setError('categoryId', { type: 'manual', message: 'Please select a valid category' });
      return;
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="dialog-form">
      <div className="form-grid">
        {/* Product Name */}
        <div className="form-group full-width">
          <label htmlFor="modal-item-name">
            Product Name <span className="required">*</span>
          </label>
          <input
            id="modal-item-name"
            type="text"
            placeholder="e.g. Mechanical Keyboard"
            required
            className={errors.name ? 'input-error' : ''}
            {...register('name', { required: 'Product name is required' })}
          />
          {errors.name && (
            <span className="field-error" role="alert">
              {errors.name.message}
            </span>
          )}
        </div>

        {/* SKU */}
        <div className="form-group">
          <label htmlFor="modal-item-sku">
            SKU Code <span className="required">*</span>
          </label>
          <input
            id="modal-item-sku"
            type="text"
            placeholder="e.g. ELEC-KB-001"
            required
            className={errors.sku ? 'input-error' : ''}
            {...register('sku', { required: 'SKU is required' })}
          />
          {errors.sku && (
            <span className="field-error" role="alert">
              {errors.sku.message}
            </span>
          )}
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="modal-item-category">
            Category <span className="required">*</span>
          </label>
          <div className="category-field-row">
            <select
              id="modal-item-category"
              className={errors.categoryId ? 'input-error' : ''}
              required
              {...register('categoryId', {
                required: 'Please select a valid category',
                onChange: (event) => {
                  const selectedCategory = categories.find((item) => item.id === event.target.value);
                  if (selectedCategory?.lowStockThreshold !== undefined) {
                    setValue('lowStockThreshold', selectedCategory.lowStockThreshold);
                  }
                },
              })}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {onRequestCreateCategory && (
              <button
                type="button"
                className="btn-secondary category-add-btn"
                onClick={onRequestCreateCategory}
              >
                + Add Category
              </button>
            )}
          </div>
          {errors.categoryId && (
            <span className="field-error" role="alert">
              {errors.categoryId.message}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="form-group">
          <label htmlFor="modal-item-price">
            Unit Price (₹) <span className="required">*</span>
          </label>
          <input
            id="modal-item-price"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
            className={errors.price ? 'input-error' : ''}
            {...register('price', { valueAsNumber: true, required: 'Unit price is required' })}
          />
          {errors.price && (
            <span className="field-error" role="alert">
              {errors.price.message}
            </span>
          )}
        </div>

        {/* Initial Stock */}
        <div className="form-group">
          <label htmlFor="modal-item-stock">
            Initial Stock <span className="required">*</span>
          </label>
          <input
            id="modal-item-stock"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            required
            className={errors.stock ? 'input-error' : ''}
            {...register('stock', { valueAsNumber: true, required: 'Initial stock is required' })}
          />
          {errors.stock && (
            <span className="field-error" role="alert">
              {errors.stock.message}
            </span>
          )}
        </div>

        {/* Low-stock threshold */}
        <div className="form-group full-width">
          <label htmlFor="modal-item-threshold">
            Low-Stock Alert Threshold <span className="required">*</span>
          </label>
          <input
            id="modal-item-threshold"
            type="number"
            min="0"
            step="1"
            placeholder="5"
            required
            className={errors.lowStockThreshold ? 'input-error' : ''}
            {...register('lowStockThreshold', {
              valueAsNumber: true,
              required: 'Threshold is required',
            })}
          />
          <small className="field-hint">
            Alerts when stock level is equal to or falls below this number.
          </small>
          {errors.lowStockThreshold && (
            <span className="field-error" role="alert">
              {errors.lowStockThreshold.message}
            </span>
          )}
        </div>
      </div>

      <div className="form-actions-modal">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Product'}
        </button>
      </div>
    </form>
  );
}

export default ItemForm;
