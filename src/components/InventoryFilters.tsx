import type { Category } from '../types/inventory';

type InventoryFiltersProps = {
  search: string;
  selectedCategory: string;
  sortOrder: 'asc' | 'desc';
  categories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: 'asc' | 'desc') => void;
  onReset?: () => void;
};

function InventoryFilters({
  search,
  selectedCategory,
  sortOrder,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onReset,
}: InventoryFiltersProps) {
  const hasFilters = search.trim() !== '' || selectedCategory !== 'all' || sortOrder !== 'asc';

  return (
    <div className="filter-bar">
      {/* Search Input */}
      <div className="filter-item filter-search">
        <label htmlFor="inv-search">Search Products</label>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="inv-search"
            type="search"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="filter-item">
        <label htmlFor="inv-category">Category</label>
        <select
          id="inv-category"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By Stock */}
      <div className="filter-item">
        <label htmlFor="inv-sort">Sort Stock</label>
        <select
          id="inv-sort"
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value as 'asc' | 'desc')}
        >
          <option value="asc">Lowest Stock First (Critical First)</option>
          <option value="desc">Highest Stock First</option>
        </select>
      </div>

      {/* Reset Filter Button */}
      {hasFilters && onReset && (
        <div className="filter-item filter-reset">
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={onReset}
            title="Reset filters to default"
          >
            ✕ Reset
          </button>
        </div>
      )}
    </div>
  );
}

export default InventoryFilters;
