import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import CancelOrderModal from '../components/CancelOrderModal.jsx';

const TABS = ['All', 'PENDING', 'RESERVED', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED'];
const TAB_LABELS = { All: 'All', PENDING: 'Pending', RESERVED: 'Processing', PAID: 'Delivered', CANCELLED: 'Cancelled', EXPIRED: 'Expired', FAILED: 'Failed' };

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('All');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = () => api.listOrders().then(setOrders).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    // Poll every 5 s so reservation expiry and status changes appear
    // automatically without a manual page refresh.
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = tab === 'All' ? orders : orders.filter((o) => o.status === tab);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setError(null);
    setMessage(null);
    try {
      if (cancelTarget.status === 'PAID') {
        const res = await api.refundOrder(cancelTarget.id);
        setMessage(`Refund ${res.reference} issued for $${res.amount.toFixed(2)}.`);
      } else {
        await api.cancelOrder(cancelTarget.id);
      }
      setCancelTarget(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container narrow">
      <h2>My Orders</h2>
      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <div className="status-tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{TAB_LABELS[t]}</button>
        ))}
      </div>

      {filtered.map((o) => (
        <div className="order-row" key={o.id}>
          <div>
            <strong>#ORD-{String(o.id).padStart(4, '0')}</strong>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</div>
          <div>${o.totalAmount.toFixed(2)}</div>
          <span className={`badge ${o.status}`}>{TAB_LABELS[o.status] || o.status}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/orders/${o.id}`} className="btn secondary">View Details</Link>
            {(o.status === 'RESERVED' || o.status === 'PENDING' || o.status === 'PAID') && (
              <button className="btn danger outline" onClick={() => setCancelTarget(o)}>
                {o.status === 'PAID' ? 'Cancel & Refund' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <div className="card">No orders in this category.</div>}

      <CancelOrderModal
        order={cancelTarget}
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
        loading={cancelling}
      />
    </div>
  );
}
