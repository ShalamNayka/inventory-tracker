import { useEffect, useState } from 'react';
import { getItems } from '../api/inventoryApi';
import type { Item } from '../types/inventory';

function FetchInventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadItems() {
      try {
        setLoading(true);
        setError('');

        const data = await getItems();

        if (!controller.signal.aborted) {
          setItems(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : 'Unable to load inventory.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadItems();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return <p>Loading inventory...</p>;
  }

  if (error) {
    return <p role="alert">Error: {error}</p>;
  }

  return (
    <section>
      <h1>Inventory API Test</h1>

      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.name} — ₹{item.price} — Stock: {item.stock}
            </li>
          ))}
        </ul>
      ) : (
        <p>No inventory items found.</p>
      )}
    </section>
  );
}

export default FetchInventory;
