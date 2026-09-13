import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import BookCover from '../components/BookCover.jsx';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('description');
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.getProduct(id).then(setProduct).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="container"><div className="error-banner">{error}</div></div>;
  if (!product) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        <Link to="/">Home</Link> &rsaquo; <Link to="/products">Books</Link> &rsaquo; {product.name}
      </div>

      <div className="card pd-layout">
        <BookCover imageUrl={product.imageUrl} category={product.category} alt={product.name} size="large" />
        <div>
          <h2>{product.name}</h2>
          <p style={{ color: 'var(--muted)' }}>{product.category}</p>
          <div className="pd-price">${product.price.toFixed(2)}</div>

          <div className="in-stock-pill">
            {product.availableStock > 0 ? `✓ In Stock (${product.availableStock} available)` : '✕ Out of Stock'}
          </div>
          <div className="shipping-note">🚚 Free shipping on orders over $35</div>

          <div className="pd-qty">
            <button className="btn secondary" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
            <span>{qty}</span>
            <button className="btn secondary" onClick={() => setQty((q) => Math.min(product.availableStock, q + 1))}>+</button>
          </div>

          <button className="btn-cart" disabled={product.availableStock === 0}
            onClick={() => addItem(product, qty)}>🛒 Add to Cart</button>{' '}
          <button className="btn secondary" disabled={product.availableStock === 0}
            onClick={() => { addItem(product, qty); navigate('/cart'); }}>Buy Now</button>

          <div className="tabs">
            <button className={tab === 'description' ? 'active' : ''} onClick={() => setTab('description')}>Description</button>
            <button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>Details</button>
          </div>
          {tab === 'description' && (
            <p>{product.description || 'No description available for this title yet.'}</p>
          )}
          {tab === 'details' && (
            <table>
              <tbody>
                <tr><td>Category</td><td>{product.category || '—'}</td></tr>
                <tr><td>Price</td><td>${product.price.toFixed(2)}</td></tr>
                <tr><td>Available Stock</td><td>{product.availableStock}</td></tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
