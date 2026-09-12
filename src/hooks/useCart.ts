'use client';

import { useState, useEffect, useCallback } from 'react';

export function useCart() {
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('sugar_spice_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        setCart([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sugar_spice_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product: any, variantIndex: number) => {
    const variant = product.variants[variantIndex];
    if (!variant) return;

    setCart(prev => {
      const existing = prev.find(
        item => item.productId === product.id && item.variantIndex === variantIndex
      );

      if (existing) {
        if (existing.quantity < variant.stock) {
          const updated = prev.map(item =>
            item.productId === product.id && item.variantIndex === variantIndex
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          return updated;
        } else {
          alert('Not enough stock available!');
          return prev;
        }
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          variantIndex,
          weight: variant.weight,
          price: variant.price,
          quantity: 1,
          image: product.image
        }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: number, variantIndex: number) => {
    setCart(prev => {
      const item = prev.find(i => i.productId === productId && i.variantIndex === variantIndex);
      if (!item) return prev;
      if (item.quantity > 1) {
        return prev.map(i =>
          i.productId === productId && i.variantIndex === variantIndex
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      } else {
        return prev.filter(i => !(i.productId === productId && i.variantIndex === variantIndex));
      }
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getTotalItems = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const getTotalPrice = useCallback(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  return {
    cart,
    setCart,
    addToCart,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice
  };
}