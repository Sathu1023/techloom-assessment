import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';

const LOW_STOCK_THRESHOLD = 5;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([api.listOrders(), api.listProducts()])
      .then(([o, p]) => { setOrders(o); setProducts(p); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === 'PAID');
    const totalSales = paid.reduce((sum, o) => sum + o.totalAmount, 0);
    const lowStock = products.filter((p) => p.availableStock > 0 && p.availableStock <= LOW_STOCK_THRESHOLD).length;
    const pendingPayments = orders.filter((o) => o.status === 'RESERVED' || o.status === 'PENDING').length;
    return { totalSales, totalOrders: orders.length, lowStock, pendingPayments };
  }, [orders, products]);

  const chart = useMemo(() => {
    const buckets = Array.from({ length: 7 }, () => 0);
    const today = new Date();
    orders.filter((o) => o.status === 'PAID').forEach((o) => {
      const d = new Date(o.createdAt);
      const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        buckets[6 - diffDays] += o.totalAmount;
      }
    });
    const max = Math.max(1, ...buckets);
    return buckets.map((amount, i) => {
      const dayIndex = (today.getDay() - (6 - i) + 7) % 7;
      return { label: DAY_LABELS[dayIndex], amount, pct: Math.max(4, Math.round((amount / max) * 100)) };
    });
  }, [orders]);

  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h2>Welcome back, Admin! 👋</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Here's what's happening with your store today.</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total Sales</div>
          <div className="value">${stats.totalSales.toFixed(2)}</div>
          <div className="sub">from {orders.filter((o) => o.status === 'PAID').length} paid orders</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Orders</div>
          <div className="value">{stats.totalOrders}</div>
          <div className="sub">all time</div>
        </div>
        <div className={`stat-card ${stats.lowStock > 0 ? 'warn' : ''}`}>
          <div className="label">Low Stock</div>
          <div className="value">{stats.lowStock}</div>
          <div className="sub">{stats.lowStock > 0 ? 'Needs attention' : 'All good'}</div>
        </div>
        <div className={`stat-card ${stats.pendingPayments > 0 ? 'warn' : ''}`}>
          <div className="label">Pending Payments</div>
          <div className="value">{stats.pendingPayments}</div>
          <div className="sub">{stats.pendingPayments > 0 ? 'Action required' : 'All clear'}</div>
        </div>
      </div>

      <div className="card">
        <h3>Sales Overview (last 7 days)</h3>
        <div className="mini-chart">
          {chart.map((c, i) => (
            <div className="bar" key={i} style={{ height: `${c.pct}%` }} title={`$${c.amount.toFixed(2)}`}>
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Recent Orders</h3>
        <table>
          <thead><tr><th>Order</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id}>
                <td><Link to="/reservations">#ORD-{String(o.id).padStart(4, '0')}</Link></td>
                <td>${o.totalAmount.toFixed(2)}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={3}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
