export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface Variant {
  weight: string;
  price: number;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  image: string;
  variants: Variant[];
  createdAt: string;
}

export interface DeliveryCharge {
  id: number;
  location: string;
  charge: number;
}

export interface CartItem {
  productId: number;
  name: string;
  variantIndex: number;
  weight: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderItem {
  productId: number;
  name: string;
  variant: string;
  quantity: number;
  price: number;
  packed?: number;
}

export interface Order {
  id: number;
  orderNumber: string | number;  // Accept both string and number
  customer: string;
  customerLocation: string;
  location: string;
  collectionMethod: 'pickup' | 'delivery' | 'store' | 'walkin' | 'special';
  deliveryCharge: number;
  subtotal: number;
  total: number;
  items: OrderItem[];
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  paymentGPay: number;
  paymentCash: number;
  advanceUsed: number;
  paymentMethod: string;
  paymentConfirmed: boolean;
  isSpecial?: boolean;
  isOffer?: boolean;
  offerId?: string;
  offerQty?: number;
  specialDescription?: string;
  specialDeliveryDate?: string | null;
  isWalkin?: boolean;
  feedback?: string;
}

export interface Offer {
  id: string;
  name: string;
  amount: number;
  deadline: string;
  description: string;
  createdAt: string;
  bookedCount: number;
}

export interface AdvancePayment {
  id: number;
  customer: string;
  amount: number;
  method: string;
  notes: string;
  date: string;
}