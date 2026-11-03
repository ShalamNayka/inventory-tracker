import { useState, useMemo } from 'react';
import Header from '../components/Header';
import { useItems, useStockMovements } from '../api/inventoryQueries';

function StockHistoryPage() {
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: movements = [], isLoading: movesLoading, error } = useStockMovements();

  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i.name])), [items]);

  const filteredMovements = useMemo(() => {
    return movements
      .filter((m) => filterType === 'ALL' || m.type === filterType)
      .filter((m) => {
        if (!searchTerm.trim()) return true;
        const itemName = itemMap.get(m.itemId)?.toLowerCase() ?? '';
        const reason = m.reason.toLowerCase();
        const term = searchTerm.toLowerCase();
        return itemName.includes(term) || reason.includes(term);
      })
      .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [movements, filterType, searchTerm, itemMap]);

  const loading = itemsLoading || movesLoading;

  return (
    <>
      <Header title="Stock Audit History" />

      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Stock Movement History</h1>
            <p className="page-sub">Complete audit log of all stock increases and decreases.</p>
          </div>
          <span className="badge badge-info">{movements.length} logged events</span>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            Failed to load history: {error.message}
          </div>
        )}

        {/* Filter controls */}
        <div className="filter-bar">
          <div className="filter-item filter-search">
            <label htmlFor="history-search">Search History</label>
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                id="history-search"
                type="search"
                placeholder="Search by product name or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="history-type">Movement Type</label>
            <select
              id="history-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'ALL' | 'IN' | 'OUT')}
            >
              <option value="ALL">All Movements</option>
              <option value="IN">Stock In Only (Restock)</option>
              <option value="OUT">Stock Out Only (Sales/Dispatches)</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading movement records...</p>
          </div>
        )}

        {!loading && filteredMovements.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>No stock movements found</h3>
            <p>
              {movements.length === 0
                ? 'No stock-in or stock-out transactions have been recorded yet.'
                : 'No transactions match your current search or type filter.'}
            </p>
          </div>
        )}

        {!loading && filteredMovements.length > 0 && (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Product Name</th>
                    <th scope="col">Type</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Reason / Notes</th>
                    <th scope="col">Logged Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>
                        {itemMap.get(m.itemId) ?? 'Unknown product'}
                      </td>
                      <td>
                        <span
                          className={`badge ${m.type === 'IN' ? 'badge-success' : 'badge-danger'}`}
                        >
                          {m.type === 'IN' ? '↑ Stock In' : '↓ Stock Out'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                      </td>
                      <td>{m.reason}</td>
                      <td className="text-muted">
                        {new Date(m.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer-info">
              <span>
                Showing {filteredMovements.length} of {movements.length} total movements
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default StockHistoryPage;
