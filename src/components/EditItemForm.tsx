import { useState } from 'react';
import type { Category, Item } from '../types/inventory';

type EditItemFormProps = {
  item: Item;
  categories: Category[];
  onSave: (
    id: string,
    updates: Pick<Item, 'name' | 'categoryId' | 'price' | 'lowStockThreshold'>,
  ) => Promise<void>;
  onCancel: () => void;
};

function EditItemForm({ item, categories, onSave, onCancel }: EditItemFormProps) {
  const [name, setName] = useState(item.name);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [price, setPrice] = useState(String(item.price));
  const [threshold, setThreshold] = useState(String(item.lowStockThreshold));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const normalizedName = name.trim();
    const numericPrice = Number(price);
    const numericThreshold = Number(threshold);

    if (!normalizedName) {
      setError('Product name is required.');
      return;
    }

    if (!categories.some((category) => category.id === categoryId)) {
      setError('Please select a valid category.');
      return;
    }

    if (price.trim() === '' || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setError('Price must be a nonnegative number.');
      return;
    }

    if (threshold.trim() === '' || !Number.isInteger(numericThreshold) || numericThreshold < 0) {
      setError('Low-stock threshold must be a nonnegative integer.');
      return;
    }

    setSaving(true);

    try {
      await onSave(item.id, {
        name: normalizedName,
        categoryId,
        price: numericPrice,
        lowStockThreshold: numericThreshold,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Edit Product</h2>

      {error && <p role="alert">{error}</p>}

      <label htmlFor="edit-item-name">Product name</label>
      <input id="edit-item-name" value={name} onChange={(event) => setName(event.target.value)} />

      <label htmlFor="edit-item-category">Category</label>
      <select
        id="edit-item-category"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <label htmlFor="edit-item-price">Price</label>
      <input
        id="edit-item-price"
        type="number"
        min="0"
        step="any"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
      />

      <label htmlFor="edit-item-threshold">Low-stock threshold</label>
      <input
        id="edit-item-threshold"
        type="number"
        min="0"
        step="1"
        value={threshold}
        onChange={(event) => setThreshold(event.target.value)}
      />

      <p>Current stock: {item.stock} units. Use Stock In/Out to change it.</p>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      <button type="button" onClick={onCancel} disabled={saving}>
        Cancel
      </button>
    </form>
  );
}

export default EditItemForm;
