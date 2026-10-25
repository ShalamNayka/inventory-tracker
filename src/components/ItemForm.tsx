import { useState } from 'react';
import type { Category } from '../types/inventory';

type ItemFormProps = {
  categories: Category[];
  onSubmit: (item: {
    name: string;
    categoryId: string;
    price: number;
    stock: number;
    lowStockThreshold: number;
  }) => Promise<void>;
  onCancel: () => void;
};

type FormValues = {
  name: string;
  categoryId: string;
  price: string;
  stock: string;
  lowStockThreshold: string;
};

const initialValues: FormValues = {
  name: '',
  categoryId: '',
  price: '',
  stock: '',
  lowStockThreshold: '',
};

function ItemForm({ categories, onSubmit, onCancel }: ItemFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const name = values.name.trim();
    const price = Number(values.price);
    const stock = Number(values.stock);
    const lowStockThreshold = Number(values.lowStockThreshold);

    if (!name) {
      setError('Product name is required.');
      return;
    }

    if (!categories.some((category) => category.id === values.categoryId)) {
      setError('Please select a valid category.');
      return;
    }

    if (values.price.trim() === '' || !Number.isFinite(price) || price < 0) {
      setError('Price must be a valid, nonnegative number.');
      return;
    }

    if (values.stock.trim() === '' || !Number.isInteger(stock) || stock < 0) {
      setError('Stock must be a nonnegative integer.');
      return;
    }

    if (
      values.lowStockThreshold.trim() === '' ||
      !Number.isInteger(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      setError('Low-stock threshold must be a nonnegative integer.');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        name,
        categoryId: values.categoryId,
        price,
        stock,
        lowStockThreshold,
      });

      setValues(initialValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create product.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Add Product</h2>

      {error && <p role="alert">{error}</p>}

      <label htmlFor="item-name">Product name</label>
      <input
        id="item-name"
        value={values.name}
        onChange={(event) => updateField('name', event.target.value)}
      />

      <label htmlFor="item-category">Category</label>
      <select
        id="item-category"
        value={values.categoryId}
        onChange={(event) => updateField('categoryId', event.target.value)}
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <label htmlFor="item-price">Price</label>
      <input
        id="item-price"
        type="number"
        min="0"
        step="any"
        value={values.price}
        onChange={(event) => updateField('price', event.target.value)}
      />

      <label htmlFor="item-stock">Initial stock</label>
      <input
        id="item-stock"
        type="number"
        min="0"
        step="1"
        value={values.stock}
        onChange={(event) => updateField('stock', event.target.value)}
      />

      <label htmlFor="item-threshold">Low-stock threshold</label>
      <input
        id="item-threshold"
        type="number"
        min="0"
        step="1"
        value={values.lowStockThreshold}
        onChange={(event) => updateField('lowStockThreshold', event.target.value)}
      />

      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add Product'}
      </button>

      <button type="button" onClick={onCancel} disabled={submitting}>
        Cancel
      </button>
    </form>
  );
}

export default ItemForm;
