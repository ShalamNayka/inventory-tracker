import Header from '../components/Header';
import { useInventoryData } from '../hooks/useInventoryDataHook';

function StockHistoryPage() {
  const { items, movements, loading, error } = useInventoryData();

  const itemMap = new Map(items.map((i) => [i.id, i.name]));

  return (
    <>
      <Header title="Stock History" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Stock Movement History</h1>
          <span className="badge badge-info">{movements.length} total records</span>
        </div>

        {loading && <div className="loading">Loading…</div>}
        {error   && <p className="alert alert-error">{error}</p>}

        {!loading && movements.length === 0 && (
          <div className="empty-state">
            <span style={{ fontSize: '2.5rem' }}>📋</span>
            <p>No stock movements recorded yet.</p>
            <p style={{ fontSize: '.8rem', marginTop: 6 }}>
              Go to Inventory and use the ↕ Stock button to record movements.
            </p>
          </div>
        )}

        {!loading && movements.length > 0 && (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{itemMap.get(m.itemId) ?? 'Unknown product'}</td>
                      <td>
                        <span className={`badge ${m.type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                          {m.type === 'IN' ? '↑ Stock In' : '↓ Stock Out'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                      <td>{m.reason}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {new Date(m.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default StockHistoryPage;
