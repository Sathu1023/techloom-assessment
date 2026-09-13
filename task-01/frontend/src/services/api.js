const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Products
  listProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Orders
  listOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  checkout: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),

  // Payments
  pay: (orderId, simulateOutcome) =>
    request(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ simulateOutcome }),
    }),
};
