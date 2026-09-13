import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState({}); // productId -> { product, quantity }

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const existingQty = prev[product.id]?.quantity || 0;
      const nextQty = Math.min(product.availableStock, existingQty + qty);
      return { ...prev, [product.id]: { product, quantity: nextQty } };
    });
  };

  const setQty = (product, qty) => {
    setItems((prev) => {
      if (qty <= 0) {
        const { [product.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [product.id]: { product, quantity: Math.min(qty, product.availableStock) } };
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => {
      const { [productId]: _, ...rest } = prev;
      return rest;
    });
  };

  const clear = () => setItems({});

  const list = useMemo(() => Object.values(items), [items]);
  const subtotal = useMemo(
    () => list.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [list]
  );

  return (
    <CartContext.Provider value={{ list, addItem, setQty, removeItem, clear, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
