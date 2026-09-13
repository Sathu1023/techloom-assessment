import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import BookCover from '../components/BookCover.jsx';

export default function CartPage() {
  const { list, setQty, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

  if (list.length === 0) {
    return (
      <div className="container narrow">
        <div className="card" style={{ textAlign: 'center' }}>
          <p>Your cart is empty.</p>
          <Link to="/products" className="btn">Browse Books</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container narrow">
      <h2>Your Cart ({list.length})</h2>
      <div className="card">
        {list.map(({ product, quantity }) => (
          <div className="cart-row" key={product.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BookCover imageUrl={product.imageUrl} category={product.category} alt={product.name} size="mini" />
              <div>
                <strong>{product.name}</strong>
                <div className="stock-tag">${product.price.toFixed(2)} each</div>
              </div>
            </div>
            <div className="qty-control">
              <button className="btn secondary" onClick={() => setQty(product, quantity - 1)}>-</button>
              <span>{quantity}</span>
              <button className="btn secondary" onClick={() => setQty(product, quantity + 1)} disabled={quantity >= product.availableStock}>+</button>
              <span style={{ width: 70, textAlign: 'right' }}>${(product.price * quantity).toFixed(2)}</span>
              <button className="btn danger" onClick={() => removeItem(product.id)}>✕</button>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontWeight: 700 }}>
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
          {subtotal >= 35 ? '🚚 Your order qualifies for free shipping!' : `Add $${(35 - subtotal).toFixed(2)} more for free shipping`}
        </div>
        <button className="btn block" style={{ marginTop: 16 }} onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
