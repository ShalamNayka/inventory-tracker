import type { Category } from '../types/inventory';

type InventoryFiltersProps = {
  search: string;
  selectedCategory: string;
  sortOrder: 'asc' | 'desc';
  categories: Category[];
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSortChange: (v: 'asc' | 'desc') => void;
};

function InventoryFilters({
  search, selectedCategory, sortOrder, categories,
  onSearchChange, onCategoryChange, onSortChange,
}: InventoryFiltersProps) {
  return (
    <div className="filter-bar">
      <div className="form-group">
        <label htmlFor="inv-search">Search</label>
        <input
          id="inv-search"
          type="search"
          placeholder="Search by product name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="inv-category">Category</label>
        <select
          id="inv-category"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="inv-sort">Sort by stock</label>
        <select
          id="inv-sort"
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value as 'asc' | 'desc')}
        >
          <option value="asc">Lowest first</option>
          <option value="desc">Highest first</option>
        </select>
      </div>
    </div>
  );
}

export default InventoryFilters;
