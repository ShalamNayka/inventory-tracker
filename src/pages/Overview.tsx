import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { isLowStock, calculateCategoryTotals } from '../utils/inventoryRules';
import { useInventoryData } from '../hooks/useInventoryDataHook';

function Overview() {
  const { items, categories, movements, loading, error } = useInventoryData();

  const lowStockCount  = items.filter(isLowStock).length;
  const categoryTotals = calculateCategoryTotals(items);
  const totalStock     = items.reduce((sum, i) => sum + i.stock, 0);
  const maxTotal       = Math.max(...Object.values(categoryTotals), 1);

  return (
    <>
      <Header title="Overview" />
      <div className="page">
        {loading && <div className="loading">Loading inventory…</div>}
        {error   && <p className="alert alert-error">{error}</p>}

        {!loading && !error && (
          <>
            {/* KPI cards */}
            <div className="stat-grid">
              <StatCard icon="📦" label="Total Products"    value={items.length}      sub="items in database" />
              <StatCard icon="🔢" label="Total Stock Units" value={totalStock}         sub="across all categories" />
              <StatCard icon="⚠️" label="Low-Stock Items"   value={lowStockCount}      sub="need attention" accent={lowStockCount > 0 ? 'danger' : 'success'} />
              <StatCard icon="🗂️" label="Categories"        value={categories.length}  sub="active groups" />
            </div>

            {/* Stock by category */}
            <div className="card">
              <div className="card-header">
                <h2>Stock by Category</h2>
                <span className="badge badge-info">{movements.length} movements recorded</span>
              </div>

              {categories.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No categories yet.</p>
              ) : (
                categories.map((cat) => {
                  const total   = categoryTotals[cat.id] ?? 0;
                  const pct     = Math.round((total / maxTotal) * 100);
                  const itemCnt = items.filter((i) => i.categoryId === cat.id).length;
                  return (
                    <div key={cat.id} className="category-row">
                      <div className="category-info">
                        <span className="category-name">{cat.name}</span>
                        <span className="category-count">{itemCnt} product{itemCnt !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="category-bar-wrap">
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div
                            className={`progress-fill ${pct < 20 ? 'low' : pct < 50 ? 'mid' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="category-total">{total} units</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Recent movements */}
            {movements.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-header"><h2>Recent Stock Movements</h2></div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th><th>Type</th><th>Qty</th><th>Reason</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.slice(0, 5).map((m) => (
                        <tr key={m.id}>
                          <td>{items.find((i) => i.id === m.itemId)?.name ?? '—'}</td>
                          <td>
                            <span className={`badge ${m.type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                              {m.type === 'IN' ? '↑ In' : '↓ Out'}
                            </span>
                          </td>
                          <td>{m.quantity}</td>
                          <td>{m.reason}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Overview;
