import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

const LOW_STOCK_THRESHOLD = 5;

function statusFor(p) {
  if (p.availableStock <= 0) return { label: 'Out of Stock', cls: 'CANCELLED' };
  if (p.availableStock <= LOW_STOCK_THRESHOLD) return { label: 'Low Stock', cls: 'PENDING' };
  return { label: 'In Stock', cls: 'PAID' };
}

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listProducts().then(setProducts).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Inventory</h2>
      {error && <div className="error-banner">{error}</div>}
      <div className="card">
        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
              <tr><th>Book</th><th>Total Stock</th><th>Reserved</th><th>Available</th><th>Status</th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const s = statusFor(p);
                return (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.totalStock}</td>
                    <td>{p.reservedStock}</td>
                    <td>{p.availableStock}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                  </tr>
                );
              })}
              {products.length === 0 && <tr><td colSpan={5}>No products yet — add some from Product Management.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
