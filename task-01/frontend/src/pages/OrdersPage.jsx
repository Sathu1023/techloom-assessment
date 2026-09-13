import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  const load = () => api.listOrders().then(setOrders).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // poll so expirations show up without manual refresh
    return () => clearInterval(t);
  }, []);

  const cancel = async (id) => {
    setError(null);
    try {
      await api.cancelOrder(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2>Orders & Payments</h2>
      {error && <div className="error-banner">{error}</div>}
      <div className="card">
        <table>
          <thead>
            <tr><th>Order</th><th>Items</th><th>Total</th><th>Status</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}</td>
                <td>${o.totalAmount.toFixed(2)}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>
                  {(o.status === 'RESERVED' || o.status === 'PAID' || o.status === 'PENDING') && (
                    <button className="btn danger" onClick={() => cancel(o.id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
