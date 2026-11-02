import Header from '../components/Header';
import { useInventoryData } from '../hooks/useInventoryDataHook';
import { calculateCategoryTotals, isLowStock } from '../utils/inventoryRules';

function CategoriesPage() {
  const { items, categories, loading, error } = useInventoryData();
  const totals  = calculateCategoryTotals(items);
  const maxTotal = Math.max(...Object.values(totals), 1);

  return (
    <>
      <Header title="Categories" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Stock by Category</h1>
          <span className="badge badge-info">{categories.length} categories</span>
        </div>

        {loading && <div className="loading">Loading…</div>}
        {error   && <p className="alert alert-error">{error}</p>}

        {!loading && categories.map((cat) => {
          const catItems   = items.filter((i) => i.categoryId === cat.id);
          const total      = totals[cat.id] ?? 0;
          const pct        = Math.round((total / maxTotal) * 100);
          const lowItems   = catItems.filter(isLowStock);

          return (
            <div key={cat.id} className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div>
                  <h2>{cat.name}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>
                    {catItems.length} product{catItems.length !== 1 ? 's' : ''}
                    {lowItems.length > 0 && (
                      <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                        ⚠ {lowItems.length} low stock
                      </span>
                    )}
                  </p>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {total} units
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${pct < 20 ? 'low' : pct < 50 ? 'mid' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {catItems.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th><th>Price</th><th>Stock</th><th>Threshold</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                          <td>{item.stock}</td>
                          <td>{item.lowStockThreshold}</td>
                          <td>
                            <span className={`badge ${isLowStock(item) ? 'badge-danger' : 'badge-success'}`}>
                              {isLowStock(item) ? '⚠ Low' : '✓ OK'}
                            </span>
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
