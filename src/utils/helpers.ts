import { Order } from '@/types';

export const getDateOnly = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
};

export const formatDateTime = (dateString: string): string => {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
};

export const getUnpaidAmount = (order: Order): number => {
  const total = order.total || 0;
  const paid = (order.paymentGPay || 0) + (order.paymentCash || 0) + (order.advanceUsed || 0);
  return total - paid;
};

export const getPaymentStatus = (order: Order): 'paid' | 'payment_received' | 'awaiting_payment' | 'bill_pending' | 'unpaid' => {
  const total = order.total || 0;
  const paid = (order.paymentGPay || 0) + (order.paymentCash || 0) + (order.advanceUsed || 0);
  const method = order.paymentMethod || '';

  // CASE 1: Fully paid - Paid amount >= Total
  if (paid >= total && total > 0) {
    return 'paid';
  }
  
  // CASE 2: Payment confirmed by admin
  if (order.paymentConfirmed === true) {
    return 'payment_received';
  }
  
  // CASE 3: Customer selected 'Unpaid' option
  if (method === 'unpaid') {
    return 'bill_pending';
  }
  
  // CASE 4: Customer selected payment method but admin hasn't confirmed yet
  if (method === 'gpay' || method === 'cash' || method === 'both') {
    // Check if any amount was actually paid
    if (paid > 0 && paid < total) {
      return 'awaiting_payment'; // Partial payment received, waiting for admin confirmation
    }
    // No payment made yet, waiting for admin to confirm
    return 'awaiting_payment';
  }
  
  // CASE 5: Customer selected 'advance' - using advance balance
  if (method === 'advance') {
    if (paid >= total) {
      return 'paid';
    }
    return 'awaiting_payment';
  }
  
  // CASE 6: No payment method selected or unknown
  if (!method || method === '') {
    return 'bill_pending';
  }
  
  return 'bill_pending';
};

export const getPaymentStatusLabel = (order: Order): string => {
  const status = getPaymentStatus(order);
  const labels = {
    paid: '💚 Fully Paid',
    payment_received: '✅ Payment Received',
    awaiting_payment: '⏳ Awaiting Payment',
    bill_pending: '📝 Bill Pending',
    unpaid: '❌ Unpaid',
  };
  return labels[status] || '📝 Bill Pending';
};

export const getPaymentStatusColor = (order: Order): string => {
  const status = getPaymentStatus(order);
  const colors = {
    paid: '#1d6b44',
    payment_received: '#1d6b44',
    awaiting_payment: '#a86f2c',
    bill_pending: '#a64b2a',
    unpaid: '#d9534f',
  };
  return colors[status] || '#a64b2a';
};

export const COLLECTION_LABELS: Record<string, string> = {
  pickup: '📦 Pickup (Collect Later)',
  delivery: '🚚 Delivery to Address',
  store: '🏪 Store Purchase',
  walkin: '🚶 Walk-in Customer',
  special: '⭐ Special Order',
};

export const COLLECTION_SHORT: Record<string, string> = {
  pickup: 'Pickup',
  delivery: 'Delivery',
  store: 'Store Buy',
  walkin: 'Walk-in',
  special: 'Special',
};

export const COLLECTION_COLORS: Record<string, string> = {
  pickup: '#e1f0e6',
  delivery: '#d6e4f0',
  store: '#f0e6dc',
  walkin: '#f0d6c0',
  special: '#f0e6b0',
};

export const LUNCH_BASE_ITEMS = ['Sambar', 'Rasam', 'Curry', 'Kootu'];
export const SATURDAY_ITEMS = ['Veg Biriyani', 'Vadai'];
export const SUNDAY_ITEMS = ['Vadai'];

export const isLunchItem = (itemName: string): boolean => {
  const allLunchItems = [...LUNCH_BASE_ITEMS, ...SATURDAY_ITEMS, ...SUNDAY_ITEMS];
  return allLunchItems.some(lunch => itemName.toLowerCase().includes(lunch.toLowerCase()));
};

export const getOrderType = (order: Order): 'lunch' | 'other' => {
  const items = order.items || [];
  for (const item of items) {
    if (isLunchItem(item.name)) return 'lunch';
  }
  return 'other';
};

export const getCustomerAdvanceBalance = (customerName: string): number => {
  if (typeof window === 'undefined') return 0;
  const advances = JSON.parse(localStorage.getItem('sugar_spice_advances') || '[]');
  let balance = 0;
  advances.forEach((a: any) => {
    if (a.customer === customerName) {
      balance += a.amount;
    }
  });
  return balance;
};

export const getActiveOffers = (): any[] => {
  if (typeof window === 'undefined') return [];
  const offers = JSON.parse(localStorage.getItem('sugar_spice_offers') || '[]');
  const now = new Date();
  return offers.filter((o: any) => {
    if (o.deadline) {
      const deadline = new Date(o.deadline);
      return deadline > now;
    }
    return true;
  });
};

// Add these functions to src/utils/helpers.ts

/**
 * Generate a random 5-character alphanumeric string
 */
export const generateRandomCode = (length: number = 5): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a professional order ID with date and random code
 * Format: ORD-YYYYMMDD-XXXXX
 * Example: ORD-20240807-A7B3C
 */
export const generateOrderId = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const randomCode = generateRandomCode(5);
  return `ORD-${dateStr}-${randomCode}`;
};

/**
 * Get all existing order IDs to avoid duplicates
 */
export const getExistingOrderIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const orders = JSON.parse(localStorage.getItem('sugar_spice_orders') || '[]');
    return orders.map((o: any) => o.orderNumber).filter(Boolean);
  } catch {
    return [];
  }
};

/**
 * Generate a unique order ID (ensures no duplicates)
 */
export const generateUniqueOrderId = (): string => {
  const existingIds = getExistingOrderIds();
  let newId: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    newId = generateOrderId();
    attempts++;
  } while (existingIds.includes(newId) && attempts < maxAttempts);
  
  return newId;
};

/**
 * Extract date from order ID and format it
 */
export const getOrderDateFromId = (orderId: string): string => {
  if (!orderId) return '';
  const parts = orderId.split('-');
  if (parts.length === 3) {
    const dateStr = parts[1];
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${day}-${month}-${year}`;
    }
  }
  return '';
};