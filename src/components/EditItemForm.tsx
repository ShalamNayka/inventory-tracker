import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editItemSchema } from '../schemas/inventorySchemas';
import type { EditItemFormData } from '../schemas/inventorySchemas';
import type { Category, Item } from '../types/inventory';
import { hasDuplicateSku } from '../utils/skuRules';

type EditItemFormProps = {
  item: Item;
  items: Item[];
  categories: Category[];
  onSave: (id: string, updates: EditItemFormData) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
};

function EditItemForm({
  item,
  items,
  categories,
  onSave,
  onCancel,
  isSaving = false,
}: EditItemFormProps) {
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      name: item.name,
      sku: item.sku ?? '',
      categoryId: item.categoryId,
      price: item.price,
      lowStockThreshold: item.lowStockThreshold,
    },
  });

  const onFormSubmit = async (data: EditItemFormData) => {
    clearErrors('sku');
    if (hasDuplicateSku(items, data.sku, item.id)) {
      setError('sku', { type: 'manual', message: 'This SKU already exists' });
      return;
    }
    if (!categories.some((category) => category.id === data.categoryId)) {
      setError('categoryId', { type: 'manual', message: 'Please select a valid category' });
      return;
    }

    await onSave(item.id, data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="dialog-form">
      <div className="form-grid">
        {/* Name */}
        <div className="form-group full-width">
          <label htmlFor="edit-item-name">
            Product Name <span className="required">*</span>
          </label>
          <input
            id="edit-item-name"
            type="text"
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
          <label htmlFor="edit-item-sku">
            SKU Code <span className="required">*</span>
          </label>
          <input
            id="edit-item-sku"
            type="text"
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
          <label htmlFor="edit-item-category">
            Category <span className="required">*</span>
          </label>
          <select
            id="edit-item-category"
            className={errors.categoryId ? 'input-error' : ''}
            required
            {...register('categoryId', { required: 'Please select a valid category' })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <span className="field-error" role="alert">
              {errors.categoryId.message}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="form-group">
          <label htmlFor="edit-item-price">
            Unit Price (₹) <span className="required">*</span>
          </label>
          <input
            id="edit-item-price"
            type="number"
            min="0.01"
            step="0.01"
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

        {/* Low-stock threshold */}
        <div className="form-group">
          <label htmlFor="edit-item-threshold">
            Low-Stock Threshold <span className="required">*</span>
          </label>
          <input
            id="edit-item-threshold"
            type="number"
            min="0"
            step="1"
            required
            className={errors.lowStockThreshold ? 'input-error' : ''}
            {...register('lowStockThreshold', {
              valueAsNumber: true,
              required: 'Threshold is required',
            })}
          />
          {errors.lowStockThreshold && (
            <span className="field-error" role="alert">
              {errors.lowStockThreshold.message}
            </span>
          )}
        </div>

        <div className="form-group full-width">
          <div className="stock-info-box">
            <span>
              Current Stock: <strong>{item.stock} units</strong>
            </span>
            <small style={{ color: 'var(--text-muted)' }}>
              (To adjust stock quantity, use the ↕ Stock In/Out movement button on the table)
            </small>
          </div>
        </div>
      </div>

      <div className="form-actions-modal">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export default EditItemForm;
