import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function ReservationsPaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);

  const load = () => api.listOrders().then((data) => {
    setOrders(data);
    if (!selectedId && data.length > 0) setSelectedId(data[0].id);
  }).catch((e) => setError(e.message));

  useEffect(() => {
    load();
    // Poll every 5 s so reservation expiry and payment status changes
    // appear automatically without a manual page refresh.
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = orders.find((o) => o.id === selectedId);

  return (
    <div>
      <h2>Reservation &amp; Payment Details</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <table>
          <thead><tr><th>Order</th><th>Reservation Expires</th><th>Payment Ref</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#ORD-{String(o.id).padStart(4, '0')}</td>
                <td>{o.reservationExpiresAt ? new Date(o.reservationExpiresAt).toLocaleString() : '—'}</td>
                <td>{o.payment?.reference || '—'}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td><button className="btn secondary sm" onClick={() => setSelectedId(o.id)}>View</button></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card">
          <h3>
            Order #ORD-{String(selected.id).padStart(4, '0')}{' '}
            <span className={`badge ${selected.status}`}>{selected.status}</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
            <div>
              <h4>Reservation Details</h4>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Created At: {new Date(selected.createdAt).toLocaleString()}</p>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                Expires At: {selected.reservationExpiresAt ? new Date(selected.reservationExpiresAt).toLocaleString() : '—'}
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Status: <strong style={{ color: 'var(--primary)' }}>{selected.status}</strong></p>
            </div>
            <div>
              <h4>Payment Details</h4>
              {selected.payment ? (
                <>
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>Transaction ID: {selected.payment.reference}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>Amount: ${selected.totalAmount.toFixed(2)}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                    Status: <span className={`badge ${selected.payment.status === 'SUCCESS' ? 'PAID' : selected.payment.status === 'FAILED' ? 'FAILED' : 'PENDING'}`}>
                      {selected.payment.status}
                    </span>
                  </p>
                  {selected.payment.settledAt && (
                    <p style={{ color: 'var(--muted)', fontSize: 14 }}>Settled At: {new Date(selected.payment.settledAt).toLocaleString()}</p>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>No payment attempt yet for this order.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
