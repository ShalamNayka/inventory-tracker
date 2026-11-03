import type { Item } from '../types/inventory';
import { isLowStock } from '../utils/inventoryRules';

type StatusBadgeProps = {
  item: Item;
};

function StatusBadge({ item }: StatusBadgeProps) {
  if (item.stock === 0) {
    return (
      <span className="badge badge-danger">
        <span className="badge-dot badge-dot-danger" />
        Out of Stock
      </span>
    );
  }

  const low = isLowStock(item);

  if (low) {
    return (
      <span className="badge badge-warning">
        <span className="badge-dot badge-dot-warning" />
        Low Stock
      </span>
    );
  }

  return (
    <span className="badge badge-success">
      <span className="badge-dot badge-dot-success" />
      In Stock
    </span>
  );
}

export default StatusBadge;

