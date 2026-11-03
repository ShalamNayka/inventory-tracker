import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockMovementFormSchema } from '../schemas/inventorySchemas';
import type { StockMovementFormData } from '../schemas/inventorySchemas';
import type { Item, StockMovement } from '../types/inventory';

type StockMovementFormProps = {
  item: Item;
  onSubmit: (type: StockMovement['type'], quantity: number, reason: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
};

function StockMovementForm({
  item,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: StockMovementFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues: {
      type: 'IN',
      quantity: 1,
      reason: '',
    },
  });

  const selectedType = useWatch({ control, name: 'type', defaultValue: 'IN' });
  const enteredQty = useWatch({ control, name: 'quantity', defaultValue: 1 });

  const onFormSubmit = async (data: StockMovementFormData) => {
    // Check business logic: can't stock out more than existing
    if (data.type === 'OUT' && data.quantity > item.stock) {
      setError('quantity', {
        type: 'manual',
        message: `Insufficient stock. You only have ${item.stock} unit(s) available.`,
      });
      return;
    }

    await onSubmit(data.type, data.quantity, data.reason);
  };

  const calculatedStock =
    selectedType === 'IN'
      ? item.stock + (Number(enteredQty) || 0)
      : Math.max(0, item.stock - (Number(enteredQty) || 0));

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="dialog-form">
      <div className="movement-summary-banner">
        <div>
          <span className="summary-title">{item.name}</span>
          {item.sku && <span className="summary-sku">SKU: {item.sku}</span>}
        </div>
        <div className="summary-stock">
          <span>
            Current: <strong>{item.stock}</strong>
          </span>
          <span className="arrow">➔</span>
          <span className="new-stock">
            Result: <strong>{calculatedStock}</strong>
          </span>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="modal-movement-type">
            Movement Type <span className="required">*</span>
          </label>
          <select id="modal-movement-type" {...register('type')}>
            <option value="IN">Stock In (Receive Delivery / Restock)</option>
            <option value="OUT">Stock Out (Sale / Dispatch / Damage)</option>
          </select>
          {errors.type && (
            <span className="field-error" role="alert">
              {errors.type.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="modal-movement-quantity">
            Quantity <span className="required">*</span>
          </label>
          <input
            id="modal-movement-quantity"
            type="number"
            min="1"
            step="1"
            className={errors.quantity ? 'input-error' : ''}
            {...register('quantity', { valueAsNumber: true })}
          />
          {errors.quantity && (
            <span className="field-error" role="alert">
              {errors.quantity.message}
            </span>
          )}
        </div>

        <div className="form-group full-width">
          <label htmlFor="modal-movement-reason">
            Reason / Notes <span className="required">*</span>
          </label>
          <input
            id="modal-movement-reason"
            type="text"
            placeholder="e.g., Weekly supplier delivery, Order #1042"
            className={errors.reason ? 'input-error' : ''}
            {...register('reason')}
          />
          {errors.reason && (
            <span className="field-error" role="alert">
              {errors.reason.message}
            </span>
          )}
        </div>
      </div>

      <div className="form-actions-modal">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Recording...' : 'Confirm Movement'}
        </button>
      </div>
    </form>
  );
}

export default StockMovementForm;
