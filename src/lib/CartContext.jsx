import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const addItem = (item) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeItem(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const totalCount = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, totalCount, totalPrice, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);