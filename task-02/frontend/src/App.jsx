import { Link, Route, Routes } from 'react-router-dom';
import { useCart } from './context/CartContext.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailsPage from './pages/ProductDetailsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderHistoryPage from './pages/OrderHistoryPage.jsx';
import OrderDetailsPage from './pages/OrderDetailsPage.jsx';

export default function App() {
  const { list } = useCart();
  const count = list.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div>
      <header className="topbar">
        <Link to="/" className="brand">
          <span style={{ fontSize: 20 }}>📚</span>
          <span>
            <span style={{ display: 'block' }}>BookNest</span>
            <span className="tagline">A smarter way to discover your next story</span>
          </span>
        </Link>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/products">Books</Link>
          <Link to="/orders">Order History</Link>
          <Link to="/cart" className="cart-pill">
            🛒 Cart <span className="cart-count">{count}</span>
          </Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
      </Routes>
    </div>
  );
}
