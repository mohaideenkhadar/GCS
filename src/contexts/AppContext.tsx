'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/utils/storage';
import { Category, Product, DeliveryCharge, Order, Offer } from '@/types';

interface AppContextType {
  categories: Category[];
  products: Product[];
  deliveryCharges: DeliveryCharge[];
  orders: Order[];
  offers: Offer[];
  refreshData: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryCharges, setDeliveryCharges] = useState<DeliveryCharge[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setCategories(storage.getCategories());
    setProducts(storage.getProducts());
    setDeliveryCharges(storage.getDeliveryCharges());
    setOrders(storage.getOrders());
    setOffers(storage.getOffers());
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    loadData();
  };

  return (
    <AppContext.Provider value={{
      categories,
      products,
      deliveryCharges,
      orders,
      offers,
      refreshData,
      isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};