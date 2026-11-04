import type { Category, Item } from '../types/inventory';
import { useRole } from '../hooks/useRole';
import StatusBadge from './StatusBadge';

type InventoryTableProps = {
  items: Item[];
  categories: Category[];
  onEdit: (item: Item) => void;
  onManageStock: (item: Item) => void;
  onDelete: (item: Item) => void;
};

function InventoryTable({
  items,
  categories,
  onEdit,
  onManageStock,
  onDelete,
}: InventoryTableProps) {
  const { isAdmin } = useRole();
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📦</span>
        <h3>No products found</h3>
        <p>No products match your current search or category filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">SKU</th>
            <th scope="col">Category</th>
            <th scope="col">Unit Price</th>
            <th scope="col">Current Stock</th>
            <th scope="col">Status</th>
            {isAdmin && (
              <th scope="col" className="text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {/* Product Name */}
              <td>
                <span className="product-name">{item.name}</span>
              </td>

              {/* SKU */}
              <td>
                <span className="sku-badge">{item.sku || '—'}</span>
              </td>

              {/* Category */}
              <td>
                <span className="category-pill">
                  {categoryNames.get(item.categoryId) ?? 'Unknown Category'}
                </span>
              </td>

              {/* Unit Price */}
              <td className="price-cell">
                {item.price.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                })}
              </td>

              {/* Current Stock */}
              <td>
                <div className="stock-cell">
                  <span className="stock-number">{item.stock}</span>
                  <span className="stock-threshold">/ {item.lowStockThreshold} min</span>
                </div>
              </td>

              {/* Stock Status Badge */}
              <td>
                <StatusBadge item={item} />
              </td>

              {/* Admin-only Actions Column */}
              {isAdmin && (
                <td className="actions-cell">
                  <div className="table-actions">
                    <button
                      type="button"
                      className="btn-action btn-action-edit"
                      onClick={() => onEdit(item)}
                      aria-label={`Edit ${item.name}`}
                    >
                      ✏ Edit
                    </button>

                    <button
                      type="button"
                      className="btn-action btn-action-stock"
                      onClick={() => onManageStock(item)}
                      aria-label={`Stock In or Out for ${item.name}`}
                    >
                      ↕ Stock
                    </button>

                    <button
                      type="button"
                      className="btn-action btn-action-delete"
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;
