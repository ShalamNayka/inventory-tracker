import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemSchema } from '../schemas/inventorySchemas';
import type { ItemFormData } from '../schemas/inventorySchemas';
import type { Category } from '../types/inventory';

type ItemFormProps = {
  categories: Category[];
  onSubmit: (data: ItemFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function ItemForm({ categories, onSubmit, onCancel, isSubmitting = false }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: '',
      price: 0,
      stock: 0,
      lowStockThreshold: 5,
    },
  });

  const onFormSubmit = async (data: ItemFormData) => {
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
            className={errors.name ? 'input-error' : ''}
            {...register('name')}
          />
          {errors.name && (
            <span className="field-error" role="alert">
              {errors.name.message}
            </span>
          )}
        </div>

        {/* SKU */}
        <div className="form-group">
          <label htmlFor="modal-item-sku">SKU Code</label>
          <input
            id="modal-item-sku"
            type="text"
            placeholder="e.g. ELEC-KB-001"
            className={errors.sku ? 'input-error' : ''}
            {...register('sku')}
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
          <select
            id="modal-item-category"
            className={errors.categoryId ? 'input-error' : ''}
            {...register('categoryId')}
          >
            <option value="">Select a category</option>
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
          <label htmlFor="modal-item-price">
            Unit Price (₹) <span className="required">*</span>
          </label>
          <input
            id="modal-item-price"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            className={errors.price ? 'input-error' : ''}
            {...register('price', { valueAsNumber: true })}
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
            className={errors.stock ? 'input-error' : ''}
            {...register('stock', { valueAsNumber: true })}
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
            className={errors.lowStockThreshold ? 'input-error' : ''}
            {...register('lowStockThreshold', { valueAsNumber: true })}
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
