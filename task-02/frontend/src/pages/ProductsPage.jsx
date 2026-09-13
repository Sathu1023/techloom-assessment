import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import BookCover from '../components/BookCover.jsx';

const ALL_CATEGORIES = ['Fiction', 'Non-Fiction', 'Technology', "Children's", 'Self-Development', 'Business'];
const SORTS = [
  { key: 'name-asc', label: 'Name (A-Z)' },
  { key: 'price-asc', label: 'Price (Low to High)' },
  { key: 'price-desc', label: 'Price (High to Low)' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStockOnly = searchParams.get('inStockOnly') === 'true';
  const sort = searchParams.get('sort') || 'name-asc';

  const runSearch = () => {
    setLoading(true);
    setError(null);
    api.searchProducts({ q, category, maxPrice: maxPrice || undefined, inStockOnly })
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { runSearch(); }, [q, category, maxPrice, inStockOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === undefined || v === false) next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next);
  };

  const sorted = [...products].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <input
          style={{ width: '100%', maxWidth: 420, padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
          placeholder="Search books..."
          defaultValue={q}
          onKeyDown={(e) => e.key === 'Enter' && update({ q: e.target.value })}
        />
      </div>

      <div className="listing-layout">
        <aside className="filter-panel">
          <div className="filter-group">
            <h4>Categories</h4>
            <label className="option">
              <input type="radio" name="cat" checked={category === ''} onChange={() => update({ category: '' })} />
              All Categories
            </label>
            {ALL_CATEGORIES.map((c) => (
              <label className="option" key={c}>
                <input type="radio" name="cat" checked={category === c} onChange={() => update({ category: c })} />
                {c}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Price Range</h4>
            <div className="price-inputs">
              <input type="number" placeholder="Max $" value={maxPrice} onChange={(e) => update({ maxPrice: e.target.value })} />
            </div>
          </div>

          <div className="filter-group">
            <h4>Availability</h4>
            <label className="option">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => update({ inStockOnly: e.target.checked })} />
              In Stock Only
            </label>
          </div>
        </aside>

        <div>
          <div className="listing-toolbar">
            <span>{sorted.length} book{sorted.length !== 1 ? 's' : ''} found</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {loading ? <p>Loading...</p> : (
            <div className="product-grid">
              {sorted.map((p) => (
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
              {sorted.length === 0 && <p>No books match your filters.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
