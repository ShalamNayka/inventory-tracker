import type { Category } from '../types/inventory';

type InventoryFiltersProps = {
  search: string;
  selectedCategory: string;
  sortOrder: 'asc' | 'desc';
  categories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: 'asc' | 'desc') => void;
};

function InventoryFilters({
  search,
  selectedCategory,
  sortOrder,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: InventoryFiltersProps) {
  return (
    <section aria-label="Inventory filters">
      <label htmlFor="inventory-search">Search products</label>
      <input
        id="inventory-search"
        type="search"
        placeholder="Search by product name"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <label htmlFor="category-filter">Category</label>
      <select
        id="category-filter"
        value={selectedCategory}
        onChange={(event) => onCategoryChange(event.target.value)}
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <label htmlFor="stock-sort">Sort by stock</label>
      <select
        id="stock-sort"
        value={sortOrder}
        onChange={(event) => onSortChange(event.target.value as 'asc' | 'desc')}
      >
        <option value="asc">Lowest stock first</option>
        <option value="desc">Highest stock first</option>
      </select>
    </section>
  );
}

export default InventoryFilters;
