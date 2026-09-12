import { Category, Product, DeliveryCharge, Order, Offer, AdvancePayment } from '@/types';

const STORAGE_KEYS = {
  CATEGORIES: 'sugar_spice_categories',
  PRODUCTS: 'sugar_spice_products',
  DELIVERY: 'sugar_spice_delivery',
  ORDERS: 'sugar_spice_orders',
  OFFERS: 'sugar_spice_offers',
  ADVANCES: 'sugar_spice_advances',
};

export const storage = {
  // Categories
  getCategories: (): Category[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setCategories: (categories: Category[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // Products
  getProducts: (): Product[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setProducts: (products: Product[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  // Delivery
  getDeliveryCharges: (): DeliveryCharge[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELIVERY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setDeliveryCharges: (charges: DeliveryCharge[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.DELIVERY, JSON.stringify(charges));
  },

  // Orders
  getOrders: (): Order[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('sugar_spice_orders');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setOrders: (orders: Order[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sugar_spice_orders', JSON.stringify(orders));
  },

  // Offers
  getOffers: (): Offer[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('sugar_spice_offers');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setOffers: (offers: Offer[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sugar_spice_offers', JSON.stringify(offers));
  },

  // Advances
  getAdvances: (): AdvancePayment[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('sugar_spice_advances');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setAdvances: (advances: AdvancePayment[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sugar_spice_advances', JSON.stringify(advances));
  },

  // Utility
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};