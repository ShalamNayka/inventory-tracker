import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { useItems, useCategories } from '../api/inventoryQueries';
import { calculateCategoryTotals, isLowStock } from '../utils/inventoryRules';

function CategoriesPage() {
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: categories = [], isLoading: catsLoading, error } = useCategories();

  const totals = calculateCategoryTotals(items);
  const maxTotal = Math.max(...Object.values(totals), 1);
  const loading = itemsLoading || catsLoading;

  return (
    <>
      <Header title="Categories &amp; Department Stock" />

      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Categories Overview</h1>
            <p className="page-sub">
              Monitor inventory volumes, stock health, and items grouped by product category.
            </p>
          </div>
          <span className="badge badge-info">{categories.length} categories active</span>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            Failed to load category data: {error.message}
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading category summaries...</p>
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🗂️</span>
            <h3>No categories found</h3>
            <p>No categories have been loaded from the API.</p>
          </div>
        )}

        {!loading &&
          categories.map((cat) => {
            const catItems = items.filter((i) => i.categoryId === cat.id);
            const totalStock = totals[cat.id] ?? 0;
            const percentage = Math.round((totalStock / maxTotal) * 100);
            const lowItems = catItems.filter(isLowStock);
            const totalValue = catItems.reduce((acc, i) => acc + i.price * i.stock, 0);

            return (
              <div key={cat.id} className="card category-detail-card">
                <div className="card-header">
                  <div>
                    <h2 className="cat-title">{cat.name}</h2>
                    <p className="card-sub">
                      {catItems.length} product{catItems.length !== 1 ? 's' : ''} in catalog
                      {lowItems.length > 0 && (
                        <span className="text-danger" style={{ marginLeft: '10px' }}>
                          ⚠️ {lowItems.length} with low stock
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="cat-kpis">
                    <div className="cat-kpi-item">
                      <span className="cat-kpi-label">Total Stock</span>
                      <span className="cat-kpi-val">{totalStock} units</span>
                    </div>
                    <div className="cat-kpi-item">
                      <span className="cat-kpi-label">Inventory Value</span>
                      <span className="cat-kpi-val">
                        {totalValue.toLocaleString('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="cat-progress-section">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${
                        percentage < 20 ? 'low' : percentage < 50 ? 'mid' : ''
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Products Table for this category */}
                {catItems.length === 0 ? (
                  <p className="text-muted" style={{ padding: '12px 0' }}>
                    No products currently assigned to this category.
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Threshold</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catItems.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td>
                              <span className="sku-badge">{item.sku || '—'}</span>
                            </td>
                            <td>
                              {item.price.toLocaleString('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                              })}
                            </td>
                            <td style={{ fontWeight: 600 }}>{item.stock}</td>
                            <td className="text-muted">{item.lowStockThreshold} min</td>
                            <td>
                              <StatusBadge item={item} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </>
  );
}

export default CategoriesPage;
