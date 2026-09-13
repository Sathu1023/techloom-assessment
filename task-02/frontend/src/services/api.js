const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

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
  listProducts: () => request('/products'),
  searchProducts: (params) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return request(`/products/search?${qs}`);
  },
  getProduct: (id) => request(`/products/${id}`),

  listOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  checkout: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
  refundOrder: (id) => request(`/orders/${id}/refund`, { method: 'POST' }),

  pay: (orderId, simulateOutcome) =>
    request(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ simulateOutcome }),
    }),
};
