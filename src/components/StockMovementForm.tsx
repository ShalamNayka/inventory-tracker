import { useState } from 'react';
import type { Item, StockMovement } from '../types/inventory';

type StockMovementFormProps = {
  item: Item;
  onSubmit: (type: StockMovement['type'], quantity: number, reason: string) => Promise<void>;
  onCancel: () => void;
};

function StockMovementForm({ item, onSubmit, onCancel }: StockMovementFormProps) {
  const [type, setType] = useState<StockMovement['type']>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const numericQuantity = Number(quantity);
    const normalizedReason = reason.trim();

    if (quantity.trim() === '' || !Number.isInteger(numericQuantity) || numericQuantity <= 0) {
      setError('Quantity must be a positive integer.');
      return;
    }

    if (!normalizedReason) {
      setError('Please provide a reason for this stock movement.');
      return;
    }

    if (type === 'OUT' && numericQuantity > item.stock) {
      setError('Insufficient stock. You cannot remove more than available.');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(type, numericQuantity, normalizedReason);
      setQuantity('');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process stock movement.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Stock In / Stock Out</h2>
      <p>
        <strong>{item.name}</strong> — Current stock: {item.stock} units
      </p>

      {error && <p role="alert">{error}</p>}

      <label htmlFor="movement-type">Movement type</label>
      <select
        id="movement-type"
        value={type}
        onChange={(event) => setType(event.target.value as StockMovement['type'])}
        disabled={submitting}
      >
        <option value="IN">Stock In</option>
        <option value="OUT">Stock Out</option>
      </select>

      <label htmlFor="movement-quantity">Quantity</label>
      <input
        id="movement-quantity"
        type="number"
        min="1"
        step="1"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        disabled={submitting}
      />

      <label htmlFor="movement-reason">Reason</label>
      <input
        id="movement-reason"
        type="text"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="e.g. New delivery or customer sale"
        disabled={submitting}
      />

      <button type="submit" disabled={submitting}>
        {submitting ? 'Processing...' : 'Save Movement'}
      </button>

      <button type="button" onClick={onCancel} disabled={submitting}>
        Cancel
      </button>
    </form>
  );
}

export default StockMovementForm;
