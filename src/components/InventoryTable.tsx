import type { Category, Item } from '../types/inventory';
import { isLowStock } from '../utils/inventoryRules';
import { useRole } from '../hooks/useRole';

type InventoryTableProps = {
  items: Item[];
  categories: Category[];
  onEdit: (item: Item) => void;
  onManageStock: (item: Item) => void;
  onDelete: (item: Item) => void;
};

function InventoryTable({ items, categories, onEdit, onManageStock, onDelete }: InventoryTableProps) {
  const { isAdmin } = useRole();
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: '2rem' }}>📭</span>
        <p>No products match your filters.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const low = isLowStock(item);
            return (
              <tr key={item.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-h)' }}>{item.name}</td>
                <td>{categoryNames.get(item.categoryId) ?? '—'}</td>
                <td>
                  {item.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: low ? 'var(--danger)' : 'var(--text-h)' }}>
                    {item.stock}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '.75rem', marginLeft: 4 }}>
                    / {item.lowStockThreshold} min
                  </span>
                </td>
                <td>
                  <span className={`badge ${low ? 'badge-danger' : 'badge-success'}`}>
                    {low ? '⚠ Low Stock' : '✓ In Stock'}
                  </span>
                </td>
                {isAdmin && (
                  <td>
                    <div className="actions">
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => onEdit(item)}
                        aria-label={`Edit ${item.name}`}
                      >
                        ✏ Edit
                      </button>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => onManageStock(item)}
                        aria-label={`Stock movement for ${item.name}`}
                      >
                        ↕ Stock
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Delete "${item.name}"? This cannot be undone.`)) {
                            onDelete(item);
                          }
                        }}
                        aria-label={`Delete ${item.name}`}
                      >
                        🗑 Delete
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
  );
}

export default InventoryTable;
