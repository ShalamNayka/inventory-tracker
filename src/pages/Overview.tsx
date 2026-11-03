import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { isLowStock, calculateCategoryTotals } from '../utils/inventoryRules';
import { useItems, useCategories, useStockMovements } from '../api/inventoryQueries';

function Overview() {
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useItems();
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: movements = [], isLoading: movesLoading } = useStockMovements();

  const loading = itemsLoading || catsLoading || movesLoading;
  const error = itemsError?.message ?? null;

  const lowStockItems = items.filter(isLowStock);
  const outOfStockItems = items.filter((i) => i.stock === 0);
  const categoryTotals = calculateCategoryTotals(items);
  const totalStockUnits = items.reduce((sum, i) => sum + i.stock, 0);
  const maxTotal = Math.max(...Object.values(categoryTotals), 1);

  return (
    <>
      <Header title="Operations Overview" />

      <div className="page overview-page">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Gathering inventory metrics...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            Failed to load dashboard data: {error}
          </div>
        )}

        {!loading && (
          <>
            {/* KPI Cards Row */}
            <section className="stat-grid" aria-label="Inventory statistics">
              <StatCard
                icon="📦"
                label="Total Products"
                value={items.length}
                sub="Active catalog items"
                accent="default"
              />
              <StatCard
                icon="🔢"
                label="Total Stock Units"
                value={totalStockUnits.toLocaleString()}
                sub="In warehouse &amp; shelves"
                accent="default"
              />
              <StatCard
                icon="⚠️"
                label="Low-Stock Alerts"
                value={lowStockItems.length}
                sub={lowStockItems.length === 0 ? 'All levels healthy' : 'Action recommended'}
                accent={lowStockItems.length > 0 ? 'warning' : 'success'}
              />
              <StatCard
                icon="🚨"
                label="Out of Stock"
                value={outOfStockItems.length}
                sub={outOfStockItems.length === 0 ? 'Zero stockouts' : 'Replenish immediately'}
                accent={outOfStockItems.length > 0 ? 'danger' : 'success'}
              />
            </section>

            {/* Split Section: Stock by Category & Recent Movements */}
            <div className="overview-split-grid">
              {/* Category Breakdown Card */}
              <section className="card overview-card">
                <div className="card-header">
                  <div>
                    <h2>Stock Distribution by Category</h2>
                    <p className="card-sub">Current units on hand across departments</p>
                  </div>
                  <span className="badge badge-info">{categories.length} categories</span>
                </div>

                {categories.length === 0 ? (
                  <p className="text-muted">No categories defined yet.</p>
                ) : (
                  <div className="category-list">
                    {categories.map((cat) => {
                      const total = categoryTotals[cat.id] ?? 0;
                      const percentage = Math.round((total / maxTotal) * 100);
                      const catProducts = items.filter((i) => i.categoryId === cat.id);

                      return (
                        <div key={cat.id} className="category-row">
                          <div className="category-info">
                            <span className="category-name">{cat.name}</span>
                            <span className="category-count">
                              {catProducts.length} product{catProducts.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="category-bar-wrap">
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${
                                  percentage < 20 ? 'low' : percentage < 50 ? 'mid' : ''
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="category-total">{total} units</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Critical Attention Card */}
              <section className="card overview-card">
                <div className="card-header">
                  <div>
                    <h2>Items Requiring Attention</h2>
                    <p className="card-sub">Items at or below low-stock thresholds</p>
                  </div>
                  <span
                    className={`badge ${
                      lowStockItems.length > 0 ? 'badge-danger' : 'badge-success'
                    }`}
                  >
                    {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {lowStockItems.length === 0 ? (
                  <div className="healthy-state">
                    <span className="healthy-icon">✅</span>
                    <p>All products have sufficient inventory reserves.</p>
                  </div>
                ) : (
                  <div className="attention-list">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="attention-item">
                        <div>
                          <strong>{item.name}</strong>
                          <span
                            className="text-muted"
                            style={{ display: 'block', fontSize: '0.8rem' }}
                          >
                            Threshold: {item.lowStockThreshold} units
                          </span>
                        </div>
                        <div className="attention-stock">
                          <span className="stock-danger-badge">{item.stock} left</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Recent Stock Movement Feed */}
            <section className="card overview-card movements-card">
              <div className="card-header">
                <div>
                  <h2>Recent Stock Movements</h2>
                  <p className="card-sub">Latest 5 audit transactions</p>
                </div>
                <span className="badge badge-info">{movements.length} total logged</span>
              </div>

              {movements.length === 0 ? (
                <p className="text-muted">No stock movements recorded yet.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Reason</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.slice(0, 5).map((m) => {
                        const matchedItem = items.find((i) => i.id === m.itemId);
                        return (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 600 }}>
                              {matchedItem?.name ?? 'Unknown item'}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  m.type === 'IN' ? 'badge-success' : 'badge-danger'
                                }`}
                              >
                                {m.type === 'IN' ? '↑ Stock In' : '↓ Stock Out'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                            <td>{m.reason}</td>
                            <td className="text-muted">
                              {new Date(m.createdAt).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

export default Overview;
