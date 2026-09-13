import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

export default function CheckoutPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // productId -> qty
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  // A fresh key is generated each time the user starts a new order.
  // Using a plain useState initialiser here would lock the key to the first
  // mount and reuse it after "Start New Order", causing the backend idempotency
  // check to return the old order instead of creating a new one.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    api.listProducts().then(setProducts).catch((e) => setError(e.message));
  }, []);

  const addToCart = (id, delta) => {
    setCart((c) => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const cartItems = useMemo(
    () => Object.entries(cart).map(([productId, quantity]) => ({
      product: products.find((p) => p.id === Number(productId)),
      quantity,
    })).filter((i) => i.product),
    [cart, products]
  );

  const total = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const startCheckout = async () => {
    setError(null);
    try {
      const res = await api.checkout({
        items: cartItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        idempotencyKey,
      });
      setOrder(res);
    } catch (e) {
      setError(e.message);
    }
  };

  const simulatePayment = async (outcome) => {
    if (!order) return;
    setPayLoading(true);
    setError(null);
    try {
      const res = await api.pay(order.id, outcome);
      setOrder(res.order);
    } catch (e) {
      setError(e.message);
    } finally {
      setPayLoading(false);
    }
  };

  // Live countdown for the 5-minute reservation hold
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secondsLeft = order?.reservationExpiresAt
    ? Math.max(0, Math.floor((new Date(order.reservationExpiresAt).getTime() - now) / 1000))
    : null;

  return (
    <div>
      <h2>New Order / Checkout</h2>
      {error && <div className="error-banner">{error}</div>}

      {!order && (
        <>
          <div className="card">
            <h3>Select Books</h3>
            <table>
              <thead><tr><th>Book</th><th>Price</th><th>Available</th><th>Qty</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>{p.availableStock}</td>
                    <td>
                      <button className="btn secondary" onClick={() => addToCart(p.id, -1)}>-</button>{' '}
                      {cart[p.id] || 0}{' '}
                      <button className="btn secondary" onClick={() => addToCart(p.id, 1)} disabled={(cart[p.id]||0) >= p.availableStock}>+</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Cart Summary</h3>
            {cartItems.length === 0 ? <p>No items yet.</p> : (
              <ul>
                {cartItems.map((i) => (
                  <li key={i.product.id}>{i.product.name} × {i.quantity} = ${(i.product.price * i.quantity).toFixed(2)}</li>
                ))}
              </ul>
            )}
            <p><strong>Total: ${total.toFixed(2)}</strong></p>
            <button className="btn" disabled={cartItems.length === 0} onClick={startCheckout}>
              Proceed to Checkout (Reserve Stock)
            </button>
          </div>
        </>
      )}

      {order && (
        <div className="card">
          <h3>Order #{order.id} <span className={`badge ${order.status}`}>{order.status}</span></h3>
          <ul>
            {order.items.map((i) => (
              <li key={i.productId}>{i.productName} × {i.quantity} = ${i.lineTotal.toFixed(2)}</li>
            ))}
          </ul>
          <p><strong>Total: ${order.totalAmount.toFixed(2)}</strong></p>

          {order.status === 'RESERVED' && (
            <>
              <p style={{ color: secondsLeft < 60 ? '#dc2626' : undefined }}>
                Reservation expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </p>
              <h4>Simulate Payment Outcome</h4>
              <button className="btn" disabled={payLoading} onClick={() => simulatePayment('SUCCESS')}>✅ Success</button>{' '}
              <button className="btn danger" disabled={payLoading} onClick={() => simulatePayment('FAILURE')}>❌ Failure</button>{' '}
              <button className="btn secondary" disabled={payLoading} onClick={() => simulatePayment('TIMEOUT')}>⏱ Timeout</button>
            </>
          )}

          {order.status === 'PAID' && <p className="success-banner">Payment successful — order confirmed!</p>}
          {order.status === 'FAILED' && <p className="error-banner">Payment failed — stock released.</p>}
          {order.status === 'EXPIRED' && <p className="error-banner">Reservation expired — stock released.</p>}

          <button className="btn secondary" onClick={() => { setOrder(null); setCart({}); setIdempotencyKey(crypto.randomUUID()); }}>Start New Order</button>
        </div>
      )}
    </div>
  );
}
