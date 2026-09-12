'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/types';
import { storage } from '@/utils/storage';
import { useToast } from '@/hooks/useToast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variantIndex: number) => void;
  removeFromCart: (productId: number, variantIndex: number) => void;
  removeItemCompletely: (productId: number, variantIndex: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  updateQuantity: (productId: number, variantIndex: number, quantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const toast = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

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

  const addToCart = (product: Product, variantIndex: number) => {
    const variant = product.variants[variantIndex];
    if (!variant) return;

    const existingIndex = cart.findIndex(
      item => item.productId === product.id && item.variantIndex === variantIndex
    );

    if (existingIndex !== -1) {
      const existing = cart[existingIndex];
      if (existing.quantity < variant.stock) {
        const newCart = [...cart];
        newCart[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        setCart(newCart);
      } else {
        toast.error('Stock Error', 'Not enough stock available!');
      }
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          variantIndex,
          weight: variant.weight,
          price: variant.price,
          quantity: 1,
          image: product.image,
        },
      ]);
      toast.success('Added to Cart', `${product.name} (${variant.weight}) added to cart!`);
    }
  };

  const removeFromCart = (productId: number, variantIndex: number) => {
    const index = cart.findIndex(
      item => item.productId === productId && item.variantIndex === variantIndex
    );
    if (index !== -1) {
      const newCart = [...cart];
      if (newCart[index].quantity > 1) {
        newCart[index] = { ...newCart[index], quantity: newCart[index].quantity - 1 };
      } else {
        newCart.splice(index, 1);
      }
      setCart(newCart);
    }
  };

  const removeItemCompletely = (productId: number, variantIndex: number) => {
    setCart(cart.filter(item => !(item.productId === productId && item.variantIndex === variantIndex)));
  };

  const clearCart = () => setCart([]);

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateQuantity = (productId: number, variantIndex: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemCompletely(productId, variantIndex);
      return;
    }
    const index = cart.findIndex(
      item => item.productId === productId && item.variantIndex === variantIndex
    );
    if (index !== -1) {
      const newCart = [...cart];
      newCart[index] = { ...newCart[index], quantity };
      setCart(newCart);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        removeItemCompletely,
        clearCart,
        getTotalItems,
        getTotalPrice,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};