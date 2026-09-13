import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

const emptyForm = { name: '', description: '', price: '', totalStock: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.listProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const body = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      totalStock: parseInt(form.totalStock, 10),
    };
    try {
      if (editingId) {
        await api.updateProduct(editingId, body);
      } else {
        await api.createProduct(body);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || '', price: p.price, totalStock: p.totalStock });
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2>Product & Inventory Management</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>{editingId ? 'Edit Product' : 'Add New Book'}</h3>
        <form onSubmit={submit}>
          <div className="grid grid-4">
            <div className="form-row">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Price ($)</label>
              <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Stock</label>
              <input required type="number" value={form.totalStock} onChange={(e) => setForm({ ...form, totalStock: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <button className="btn" type="submit">{editingId ? 'Save Changes' : 'Add Book'}</button>
          {editingId && (
            <button type="button" className="btn secondary" style={{ marginLeft: 8 }}
              onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>
          )}
        </form>
      </div>

      <div className="card">
        <h3>Inventory ({products.length})</h3>
        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
              <tr><th>Book</th><th>Price</th><th>Total Stock</th><th>Reserved</th><th>Available</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td>{p.totalStock}</td>
                  <td>{p.reservedStock}</td>
                  <td>{p.availableStock}</td>
                  <td>
                    {p.availableStock === 0
                      ? <span className="badge CANCELLED">Out of Stock</span>
                      : p.availableStock <= 5
                        ? <span className="badge PENDING">Low Stock</span>
                        : <span className="badge PAID">In Stock</span>}
                  </td>
                  <td>
                    <button className="btn secondary" onClick={() => edit(p)}>Edit</button>{' '}
                    <button className="btn danger" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
