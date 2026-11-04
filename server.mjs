import { fileURLToPath } from 'node:url';
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import { createApp } from 'json-server/lib/app.js';

const databasePath = fileURLToPath(new URL('./db.json', import.meta.url));
const database = new Low(new JSONFile(databasePath), {});
await database.read();

const app = createApp(database);

app.use((req, res, next) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const isCreate = req.method === 'POST' && pathname === '/items';
  const itemRoute = pathname.match(/^\/items\/([^/]+)$/);
  const isItemUpdate = itemRoute && (req.method === 'PUT' || req.method === 'PATCH');
  const skuIsSubmitted = isCreate || req.method === 'PUT' || Object.hasOwn(req.body ?? {}, 'sku');

  if ((!isCreate && !isItemUpdate) || !skuIsSubmitted) {
    next();
    return;
  }

  const sku = typeof req.body?.sku === 'string' ? req.body.sku.trim() : '';
  if (!sku) {
    res.status(400).json({ error: 'SKU is required' });
    return;
  }

  const itemId = itemRoute?.[1] ? decodeURIComponent(itemRoute[1]) : undefined;
  const duplicate = database.data.items?.some(
    (item) =>
      item.id !== itemId &&
      typeof item.sku === 'string' &&
      item.sku.trim().toLowerCase() === sku.toLowerCase(),
  );

  if (duplicate) {
    res.status(409).json({ error: 'This SKU already exists' });
    return;
  }

  req.body.sku = sku;
  next();
});

// Keep validation after JSON parsing but before json-server's item mutation routes.
const skuValidationMiddleware = app.middleware.pop();
app.middleware.splice(4, 0, skuValidationMiddleware);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Inventory API running at http://localhost:${port}`);
});
