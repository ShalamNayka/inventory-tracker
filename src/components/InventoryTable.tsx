import type { Category, Item } from '../types/inventory';
import { isLowStock } from '../utils/inventoryRules';

type InventoryTableProps = {
  items: Item[];
  categories: Category[];
  onEdit: (item: Item) => void;
};

function InventoryTable({ items, categories, onEdit }: InventoryTableProps) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  if (items.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Category</th>
            <th scope="col">Price</th>
            <th scope="col">Current Stock</th>
            <th scope="col">Stock Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const lowStock = isLowStock(item);

            return (
              <tr key={item.id}>
                <td>{item.name}</td>

                <td>{categoryNames.get(item.categoryId) ?? 'Unknown'}</td>

                <td>
                  {item.price.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                  })}
                </td>

                <td>{item.stock}</td>

                <td>
                  <span className={lowStock ? 'low-stock' : 'in-stock'}>
                    {lowStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    aria-label={`Edit ${item.name}`}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;
