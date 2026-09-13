import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import CancelOrderModal from '../components/CancelOrderModal.jsx';
import BookCover from '../components/BookCover.jsx';

const STATUS_LABELS = { PENDING: 'Pending', RESERVED: 'Processing', PAID: 'Delivered', CANCELLED: 'Cancelled', EXPIRED: 'Expired', FAILED: 'Failed' };

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = () => api.getOrder(id).then(setOrder).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  const confirmCancel = async () => {
    setCancelling(true);
    setError(null);
    setMessage(null);
    try {
      if (order.status === 'PAID') {
        const res = await api.refundOrder(order.id);
        setMessage(`Refund ${res.reference} issued for $${res.amount.toFixed(2)}.`);
      } else {
        await api.cancelOrder(order.id);
      }
      setShowCancel(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (error) return <div className="container narrow"><div className="error-banner">{error}</div></div>;
  if (!order) return <div className="container narrow">Loading...</div>;

  const canCancel = order.status === 'RESERVED' || order.status === 'PENDING' || order.status === 'PAID';

  return (
    <div className="container narrow">
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        <Link to="/orders">My Orders</Link> &rsaquo; Order #ORD-{String(order.id).padStart(4, '0')}
      </div>

      {message && <div className="success-banner">{message}</div>}

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Order #ORD-{String(order.id).padStart(4, '0')}</h2>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <span className={`badge ${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3>Items</h3>
          {order.items.map((i) => (
            <div key={i.productId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <BookCover imageUrl={i.productImageUrl} category={i.category} alt={i.productName} size="mini" />
              <div style={{ flex: 1 }}>
                <strong>{i.productName}</strong>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Qty: {i.quantity}</div>
              </div>
              <div>${i.lineTotal.toFixed(2)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontWeight: 700 }}>
            <span>Total</span><span>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <div className="card address-block">
            <h4>Order Status</h4>
            <p>Reservation held until: {order.reservationExpiresAt ? new Date(order.reservationExpiresAt).toLocaleString() : '—'}</p>
            <p>Last updated: {new Date(order.updatedAt).toLocaleString()}</p>
          </div>

          {canCancel && (
            <button className="btn danger outline block" onClick={() => setShowCancel(true)}>
              {order.status === 'PAID' ? 'Cancel & Refund Order' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      <CancelOrderModal
        order={showCancel ? order : null}
        onConfirm={confirmCancel}
        onClose={() => setShowCancel(false)}
        loading={cancelling}
      />
    </div>
  );
}
