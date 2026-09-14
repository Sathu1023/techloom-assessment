import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import BookCover from '../components/BookCover.jsx';

const CATEGORY_META = [
  { name: 'Fiction', icon: '📖' },
  { name: 'Non-Fiction', icon: '📘' },
  { name: 'Technology', icon: '💻' },
  { name: "Children's", icon: '🧸' },
  { name: 'Self-Development', icon: '🌱' },
  { name: 'Business', icon: '📊' },
];

export default function HomePage() {
  const [q, setQ] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch products and paid orders in parallel so bestseller ranking
    // is based on real sales data rather than arbitrary list order.
    Promise.all([api.listProducts(), api.listOrders()])
      .then(([p, o]) => { setProducts(p); setOrders(o); })
      .catch((e) => setError(e.message));
  }, []);

  const categoryCounts = CATEGORY_META.map((c) => ({
    ...c,
    count: products.filter((p) => (p.category || '').toLowerCase() === c.name.toLowerCase()).length,
  }));

  // Build a sold-units map from PAID orders, then sort products by units sold
  // descending. Products with no sales fall back to their list position.
  const bestsellers = useMemo(() => {
    const soldMap = {};
    orders
      .filter((o) => o.status === 'PAID')
      .forEach((o) => {
        o.items.forEach((item) => {
          soldMap[item.productId] = (soldMap[item.productId] || 0) + item.quantity;
        });
      });
    return [...products]
      .sort((a, b) => (soldMap[b.id] || 0) - (soldMap[a.id] || 0))
      .slice(0, 6);
  }, [products, orders]);

  const runSearch = () => {
    navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  return (
    <div>
      <section className="hero">
        <h1>Great Books Build Better Minds</h1>
        <p>Discover new worlds, explore new ideas, and find your next favorite story.</p>
        <div className="search-bar">
          <input
            placeholder="Search books, authors, genres..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          />
          <button onClick={runSearch}>Search</button>
        </div>
      </section>

      <div className="container">
        {error && <div className="error-banner">{error}</div>}

        <div className="section-heading">
          <h2>Popular Categories</h2>
          <Link to="/products" className="view-all">View All &rarr;</Link>
        </div>
        <div className="category-grid">
          {categoryCounts.map((c) => (
            <div key={c.name} className="category-card" onClick={() => navigate(`/products?category=${encodeURIComponent(c.name)}`)}>
              <div className="icon">{c.icon}</div>
              <div><strong>{c.name}</strong></div>
              <div className="count">{c.count} books</div>
            </div>
          ))}
        </div>

        <div className="section-heading">
          <h2>Bestsellers</h2>
          <Link to="/products" className="view-all">View All &rarr;</Link>
        </div>
        <div className="product-grid">
          {bestsellers.map((p) => (
            <div className="product-card" key={p.id}>
              <Link to={`/products/${p.id}`}>
                <BookCover imageUrl={p.imageUrl} category={p.category} alt={p.name} />
              </Link>
              <Link to={`/products/${p.id}`}><h3>{p.name}</h3></Link>
              <div className="category-label">{p.category}</div>
              <div className="price-row"><span className="price">${p.price.toFixed(2)}</span></div>
              <div className="stock-tag">{p.availableStock > 0 ? `${p.availableStock} in stock` : 'Out of stock'}</div>
              <button className="btn-cart" disabled={p.availableStock === 0} onClick={() => addItem(p, 1)}>
                🛒 Add to Cart
              </button>
            </div>
          ))}
          {bestsellers.length === 0 && !error && <p>No books yet — add some via the Products API (POST /api/products) to get started.</p>}
        </div>

        <div className="card" style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong>🚚 Free Shipping</strong>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>On orders over $35</div>
          </div>
          <Link to="/products" className="btn">Shop Now</Link>
        </div>
      </div>
    </div>
  );
}
