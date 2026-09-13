import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';

const STEPS = ['Shipping', 'Payment', 'Review'];
const PAYMENT_METHODS = [
  { key: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { key: 'cod', label: 'Cash on Delivery', icon: '💵' },
  { key: 'bank', label: 'Bank Transfer', icon: '🏦' },
];

export default function CheckoutPage() {
  const { list, subtotal, clear } = useCart();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0); // 0 shipping, 1 payment(reserve+method), 2 processing/result
  const [address, setAddress] = useState({ name: '', line1: '', city: '', postal: '', country: '' });
  const [method, setMethod] = useState('card');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  // A fresh key is generated each time the user restarts checkout (Try Again).
  // A fixed key per mount would cause the backend idempotency guard to return
  // the old failed/expired order instead of creating a new one.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (list.length === 0 && !order) navigate('/cart');
  }, [list, order, navigate]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secondsLeft = order?.reservationExpiresAt
    ? Math.max(0, Math.floor((new Date(order.reservationExpiresAt).getTime() - now) / 1000))
    : null;

  const reserveStockAndGoToPayment = async () => {
    setError(null);
    try {
      const res = await api.checkout({
        items: list.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        idempotencyKey,
      });
      setOrder(res);
      setStepIndex(1);
    } catch (e) {
      setError(e.message);
    }
  };

  const simulatePayment = async (outcome) => {
    if (!order) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await api.pay(order.id, outcome);
      setOrder(res.order);
      setStepIndex(2);
      if (res.order.status === 'PAID') clear();
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container narrow">
      <h2>Checkout</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="stepper">
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className={`step ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}>
              <div className="dot">{i < stepIndex ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="step-connector" />}
          </div>
        ))}
      </div>

      {stepIndex === 0 && (
        <div className="card">
          <h3>Shipping Address</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input placeholder="Full name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            <input placeholder="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            <input placeholder="Address line" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', gridColumn: '1 / -1' }} />
            <input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            <input placeholder="Postal code" value={address.postal} onChange={(e) => setAddress({ ...address, postal: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
          </div>

          <h3 style={{ marginTop: 24 }}>Order Summary</h3>
          {list.map(({ product, quantity }) => (
            <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
              <span>{product.name} × {quantity}</span>
              <span>${(product.price * quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 12 }}>
            <span>Total</span><span>${subtotal.toFixed(2)}</span>
          </div>

          <button className="btn block" style={{ marginTop: 16 }} onClick={reserveStockAndGoToPayment}>
            Continue to Payment (Reserves Stock)
          </button>
        </div>
      )}

      {stepIndex === 1 && order && (
        <div className="card" style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3>Payment Method</h3>
            <div className="payment-methods">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.key} className={method === m.key ? 'selected' : ''}>
                  <input type="radio" name="method" checked={method === m.key} onChange={() => setMethod(m.key)} />
                  <span>{m.icon}</span> {m.label}
                </label>
              ))}
            </div>
            <p style={{ color: secondsLeft < 60 ? '#dc2626' : 'var(--muted)', fontSize: 13 }}>
              Items held for {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} — complete payment before the hold expires.
            </p>
            <p><strong>Total: ${order.totalAmount.toFixed(2)}</strong></p>
          </div>

          <div className="payment-sim-panel">
            <div className="spinner" style={{ display: processing ? 'block' : 'none' }} />
            {processing ? (
              <>
                <div className="sim-title">Processing Payment</div>
                <div className="sim-sub">Please wait while we process your payment...</div>
              </>
            ) : (
              <>
                <div className="sim-title">Ready to Pay</div>
                <div className="sim-sub">Payment Options (Test)</div>
                <button className="sim-option success" onClick={() => simulatePayment('SUCCESS')}>
                  <span className="sdot" /> Success
                </button>
                <button className="sim-option failure" onClick={() => simulatePayment('FAILURE')}>
                  <span className="sdot" /> Failure
                </button>
                <button className="sim-option timeout" onClick={() => simulatePayment('TIMEOUT')}>
                  <span className="sdot" /> Timeout
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {stepIndex === 2 && order && order.status === 'PAID' && (
        <div className="card confirmation-box">
          <div className="check-circle">✓</div>
          <h2>Order Placed Successfully!</h2>
          <p style={{ color: 'var(--muted)' }}>Order #{order.id}</p>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>You will receive a confirmation email shortly.</p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn" onClick={() => navigate(`/orders/${order.id}`)}>View Order Details</button>
            <button className="btn secondary" onClick={() => navigate('/products')}>Continue Shopping</button>
          </div>
        </div>
      )}

      {stepIndex === 2 && order && (order.status === 'FAILED' || order.status === 'EXPIRED') && (
        <div className="card confirmation-box">
          <div className="check-circle" style={{ background: '#dc2626' }}>✕</div>
          <h2>{order.status === 'FAILED' ? 'Payment Failed' : 'Reservation Expired'}</h2>
          <p style={{ color: 'var(--muted)' }}>
            {order.status === 'FAILED' ? 'Your payment could not be processed.' : 'Your stock hold ran out before payment completed.'}
            {' '}Stock has been released back to inventory.
          </p>
          <button className="btn" onClick={() => { setOrder(null); setStepIndex(0); setIdempotencyKey(crypto.randomUUID()); }}>Try Again</button>
        </div>
      )}
    </div>
  );
}
