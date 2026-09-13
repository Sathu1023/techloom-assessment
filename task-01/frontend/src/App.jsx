import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import ReservationsPaymentsPage from './pages/ReservationsPaymentsPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>📚 BookNest POS</h1>
        <nav>
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}>Dashboard</NavLink>
          <NavLink to="/products" className={({isActive}) => isActive ? 'active' : ''}>Product Management</NavLink>
          <NavLink to="/inventory" className={({isActive}) => isActive ? 'active' : ''}>Inventory</NavLink>
          <NavLink to="/checkout" className={({isActive}) => isActive ? 'active' : ''}>New Order / Checkout</NavLink>
          <NavLink to="/orders" className={({isActive}) => isActive ? 'active' : ''}>Orders</NavLink>
          <NavLink to="/reservations" className={({isActive}) => isActive ? 'active' : ''}>Reservations &amp; Payments</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/reservations" element={<ReservationsPaymentsPage />} />
        </Routes>
      </main>
    </div>
  );
}
