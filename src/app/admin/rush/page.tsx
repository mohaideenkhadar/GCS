'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { Order } from '@/types';
import { formatDateTime, getPaymentStatusLabel, getUnpaidAmount } from '@/utils/helpers';
import { useToast } from '@/hooks/useToast';
import { PopupModal } from '@/components/common/PopupModal';

export default function AdminRush() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [mounted, setMounted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    loadOrders();
    
    // Auto-refresh every 10 seconds (check for new orders, but don't remove existing ones)
    const interval = setInterval(() => {
      refreshOrders();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Load orders for the selected date
  const loadOrders = useCallback(() => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const allOrders = storage.getOrders();
      
      // Filter by selected date and pending status
      let filtered = allOrders.filter(o => {
        // Only show pending orders
        if (o.status !== 'pending') return false;
        
        // Check if order date matches selected date
        const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
        return orderDate === selectedDate;
      });

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(o => {
          const orderNumberStr = o.orderNumber ? String(o.orderNumber) : '';
          const customerStr = o.customer || '';
          const locationStr = o.customerLocation || '';
          
          return orderNumberStr.toLowerCase().includes(term) ||
            customerStr.toLowerCase().includes(term) ||
            locationStr.toLowerCase().includes(term);
        });
      }

      // Sort by time (oldest first)
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      setOrders(filtered);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, searchTerm, isLoading]);

  // Refresh orders - only add new ones, don't remove existing unless they're approved/rejected
  const refreshOrders = useCallback(() => {
    try {
      const allOrders = storage.getOrders();
      
      // Get current order IDs to track which ones are already displayed
      const currentOrderIds = new Set(orders.map(o => o.id));
      
      // Filter new pending orders for the selected date
      let newOrders = allOrders.filter(o => {
        if (o.status !== 'pending') return false;
        const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
        return orderDate === selectedDate;
      });

      // Sort by time
      newOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Only update if there are new orders or existing orders have changed
      const newOrderIds = new Set(newOrders.map(o => o.id));
      
      // Check if any existing order is no longer pending (was approved/rejected elsewhere)
      const ordersToRemove = orders.filter(o => {
        const stillPending = newOrderIds.has(o.id);
        return !stillPending;
      });

      // Check for new orders
      const ordersToAdd = newOrders.filter(o => !currentOrderIds.has(o.id));

      // If there are changes, update the state
      if (ordersToRemove.length > 0 || ordersToAdd.length > 0) {
        // Keep all existing pending orders and add new ones
        const updatedOrders = orders
          .filter(o => newOrderIds.has(o.id)) // Keep only still pending
          .concat(ordersToAdd); // Add new ones
        
        // Sort by time
        updatedOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        setOrders(updatedOrders);
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  }, [orders, selectedDate]);

  // Load orders when date changes
  useEffect(() => {
    if (mounted) {
      loadOrders();
    }
  }, [selectedDate, mounted]);

  // Navigation functions
  const goToPreviousDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  // ==================== PAYMENT CONFIRMATION ====================
  const handleConfirmPayment = (orderId: number) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const total = order.total || 0;
    const paid = (order.paymentGPay || 0) + (order.paymentCash || 0) + (order.advanceUsed || 0);
    const pending = total - paid;

    if (pending > 0) {
      toast.error('Payment Pending', `Customer still owes ₹${pending.toFixed(2)}. Cannot confirm payment.`);
      return;
    }

    if (!confirm(`Confirm payment for order ${order.orderNumber?.toString()}?\n\nThis will mark the payment as received.`)) return;

    order.paymentConfirmed = true;
    storage.setOrders(allOrders);
    // Update local state to show confirmed status
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const localIndex = newOrders.findIndex(o => o.id === orderId);
      if (localIndex !== -1) {
        newOrders[localIndex] = { ...newOrders[localIndex], paymentConfirmed: true };
      }
      return newOrders;
    });
    toast.success('Payment Confirmed', `✅ Payment for order ${order.orderNumber?.toString()} has been confirmed.`);
  };

  // ==================== UNDO PAYMENT CONFIRMATION ====================
  const handleUndoPayment = (orderId: number) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    if (!confirm(`Undo payment confirmation for order ${order.orderNumber?.toString()}?\n\nThis will mark the payment as unconfirmed.`)) return;

    order.paymentConfirmed = false;
    storage.setOrders(allOrders);
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const localIndex = newOrders.findIndex(o => o.id === orderId);
      if (localIndex !== -1) {
        newOrders[localIndex] = { ...newOrders[localIndex], paymentConfirmed: false };
      }
      return newOrders;
    });
    toast.info('Payment Unconfirmed', `⏳ Payment confirmation for order ${order.orderNumber?.toString()} has been undone.`);
  };

  // Function to update a single order without reloading all
  const updateOrder = useCallback((orderId: number, updates: Partial<Order>) => {
    const allOrders = storage.getOrders();
    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;

    allOrders[orderIndex] = { ...allOrders[orderIndex], ...updates };
    storage.setOrders(allOrders);

    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const localIndex = newOrders.findIndex(o => o.id === orderId);
      if (localIndex !== -1) {
        newOrders[localIndex] = { ...newOrders[localIndex], ...updates };
      }
      return newOrders;
    });
  }, []);

  const handleApprove = useCallback((orderId: number) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const items = order.items || [];
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const packedItems = items.reduce((sum, i) => sum + (i.packed || 0), 0);
    const totalAmount = order.total || 0;
    const paidAmount = (order.paymentGPay || 0) + (order.paymentCash || 0);

    // Check if payment is confirmed
    if (!order.paymentConfirmed && paidAmount > 0) {
      if (!confirm(`⚠️ Payment not confirmed!\n\nCustomer has paid ₹${paidAmount.toFixed(2)} but payment is not confirmed.\n\nApprove anyway?`)) return;
    }

    let warnings = [];
    if (paidAmount < totalAmount) {
      warnings.push(`Payment not fully received!\nTotal: ₹${totalAmount.toFixed(2)}\nPaid: ₹${paidAmount.toFixed(2)}`);
    }
    if (packedItems < totalItems) {
      warnings.push(`Not all items are packed! (${packedItems}/${totalItems} packed)`);
    }

    if (warnings.length > 0) {
      if (!confirm(`⚠️ ${warnings.join('\n\n')}\n\nApprove anyway?`)) return;
    }

    // Update order status to completed
    updateOrder(orderId, { status: 'completed' });
    toast.success('Order approved!');
    
    // Remove from list after approval
    setTimeout(() => {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }, 500);
  }, [updateOrder, toast]);

  const handleReject = useCallback((orderId: number) => {
    if (!confirm('Reject this order?')) return;
    updateOrder(orderId, { status: 'rejected' });
    toast.error('Order rejected');
    
    setTimeout(() => {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }, 500);
  }, [updateOrder, toast]);

  const handleApproveAll = useCallback(() => {
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (pendingOrders.length === 0) {
      toast.error('No Orders', 'No pending orders for this date.');
      return;
    }

    if (!confirm(`Approve all ${pendingOrders.length} orders for ${new Date(selectedDate).toLocaleDateString('en-IN')}?`)) return;

    const allOrders = storage.getOrders();
    const orderIds = pendingOrders.map(o => o.id);
    
    orderIds.forEach(id => {
      const order = allOrders.find(ord => ord.id === id);
      if (order) order.status = 'completed';
    });
    storage.setOrders(allOrders);
    
    setOrders(prev => prev.filter(o => !orderIds.includes(o.id)));
    toast.success(`${pendingOrders.length} orders approved!`);
  }, [orders, toast, selectedDate]);

  const handlePackToggle = useCallback((orderId: number, itemIndex: number) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items[itemIndex];
    if (!item) return;

    const packed = item.packed || 0;
    const quantity = item.quantity || 0;
    if (packed >= quantity) {
      item.packed = Math.max(0, packed - 1);
    } else {
      item.packed = Math.min(quantity, packed + 1);
    }
    
    storage.setOrders(allOrders);
    
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const localIndex = newOrders.findIndex(o => o.id === orderId);
      if (localIndex !== -1) {
        const updatedItems = [...(newOrders[localIndex].items || [])];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], packed: item.packed };
        newOrders[localIndex] = { ...newOrders[localIndex], items: updatedItems };
      }
      return newOrders;
    });
  }, []);

  const handlePackAll = useCallback((orderId: number, itemIndex: number) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items[itemIndex];
    if (!item) return;
    item.packed = item.quantity || 0;
    storage.setOrders(allOrders);
    
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const localIndex = newOrders.findIndex(o => o.id === orderId);
      if (localIndex !== -1) {
        const updatedItems = [...(newOrders[localIndex].items || [])];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], packed: item.packed };
        newOrders[localIndex] = { ...newOrders[localIndex], items: updatedItems };
      }
      return newOrders;
    });
  }, []);

  const handleUnpackAll = useCallback((orderId: number, itemIndex: number) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items[itemIndex];
    if (!item) return;
    item.packed = 0;
    storage.setOrders(allOrders);
    
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const localIndex = newOrders.findIndex(o => o.id === orderId);
      if (localIndex !== -1) {
        const updatedItems = [...(newOrders[localIndex].items || [])];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], packed: 0 };
        newOrders[localIndex] = { ...newOrders[localIndex], items: updatedItems };
      }
      return newOrders;
    });
  }, []);

  // Payment Functions
  const handleAddPayment = useCallback((orderId: number, paymentType: 'gpay' | 'cash', amount: number) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const totalAmount = order.total || 0;
    const currentGPay = order.paymentGPay || 0;
    const currentCash = order.paymentCash || 0;
    const totalPaid = currentGPay + currentCash;
    const remaining = totalAmount - totalPaid;
    
    if (amount <= 0 || amount > remaining) {
      toast.error('Invalid Amount', `Remaining: ₹${remaining.toFixed(2)}`);
      return;
    }
    
    if (paymentType === 'gpay') {
      order.paymentGPay = currentGPay + amount;
    } else {
      order.paymentCash = currentCash + amount;
    }
    
    // Reset confirmation if payment amount changes
    order.paymentConfirmed = false;
    
    storage.setOrders(allOrders);
    
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const localIndex = newOrders.findIndex(o => o.id === orderId);
      if (localIndex !== -1) {
        newOrders[localIndex] = { ...newOrders[localIndex], ...order };
      }
      return newOrders;
    });
    
    toast.success('Payment Added', `₹${amount.toFixed(2)} added via ${paymentType.toUpperCase()}`);
  }, [toast]);

  const handlePayFull = useCallback((orderId: number, paymentType: 'gpay' | 'cash') => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const totalAmount = order.total || 0;
    const currentGPay = order.paymentGPay || 0;
    const currentCash = order.paymentCash || 0;
    const totalPaid = currentGPay + currentCash;
    const remaining = totalAmount - totalPaid;
    
    if (remaining <= 0) {
      toast.info('Already Paid', 'Already fully paid!');
      return;
    }
    
    if (paymentType === 'gpay') {
      order.paymentGPay = totalAmount;
      order.paymentCash = 0;
    } else {
      order.paymentCash = totalAmount;
      order.paymentGPay = 0;
    }
    
    // Reset confirmation if payment amount changes
    order.paymentConfirmed = false;
    
    storage.setOrders(allOrders);
    
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const localIndex = newOrders.findIndex(o => o.id === orderId);
      if (localIndex !== -1) {
        newOrders[localIndex] = { ...newOrders[localIndex], ...order };
      }
      return newOrders;
    });
    
    toast.success('Full Payment', `✅ Full amount ₹${totalAmount.toFixed(2)} paid via ${paymentType.toUpperCase()}`);
  }, [toast]);

  const handleResetPayments = useCallback((orderId: number) => {
    if (!confirm('Reset all payments for this order?')) return;
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    order.paymentGPay = 0;
    order.paymentCash = 0;
    order.paymentConfirmed = false;
    storage.setOrders(allOrders);
    
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const localIndex = newOrders.findIndex(o => o.id === orderId);
      if (localIndex !== -1) {
        newOrders[localIndex] = { ...newOrders[localIndex], ...order };
      }
      return newOrders;
    });
    
    toast.success('Payments Reset', '✅ All payments reset.');
  }, [toast]);

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  }, []);

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AdminNavbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
            <p className="mt-2 text-text-light">Loading...</p>
          </div>
        </main>
        <Footer isAdmin />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
              <i className="fas fa-bolt text-[#ff6b00]"></i>
              Rush Orders
            </h2>
            <span className="inline-flex items-center px-3 py-1 bg-primary text-white rounded-full text-sm font-semibold">
              {orders.length} Pending
            </span>
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-xs text-text-light">
                <i className="fas fa-spinner fa-spin"></i> Loading...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={goToPreviousDate}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-border-light transition-colors"
              title="Previous Day"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            
            <button 
              onClick={goToNextDate}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-border-light transition-colors"
              title="Next Day"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            
            <button 
              onClick={goToToday}
              className="px-3 py-1.5 border border-border rounded-lg text-sm bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              Today
            </button>
            
            <button 
              onClick={loadOrders} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white rounded-lg text-sm font-medium hover:bg-border-light transition-colors duration-200"
              disabled={isLoading}
            >
              <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i>
            </button>
          </div>
        </div>

        {/* Date Display */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-calendar-day text-primary-light"></i>
            <span className="text-sm font-medium text-text">
              Showing orders for: 
              <span className="ml-1 font-bold text-primary">
                {formatDisplayDate(selectedDate)}
              </span>
            </span>
          </div>
          <span className="text-xs text-text-light">
            ({orders.length} pending orders)
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[300px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-light text-sm"></i>
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-primary transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <span className="text-xs text-text-light">
            {orders.length} results
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-border shadow-card">
            <i className="fas fa-check-circle text-5xl text-success block mb-3"></i>
            <p className="text-text-light text-lg">
              No pending orders for {formatDisplayDate(selectedDate)}!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order, index) => {
              const items = order.items || [];
              const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
              const packedItems = items.reduce((sum, i) => sum + (i.packed || 0), 0);
              const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
              const isFullyPacked = progress === 100 && totalItems > 0;
              const totalAmount = order.total || 0;
              const paidAmount = (order.paymentGPay || 0) + (order.paymentCash || 0);
              const remaining = totalAmount - paidAmount;
              const isPaymentConfirmed = order.paymentConfirmed === true;

              return (
                <div 
                  key={order.id} 
                  ref={(el) => { cardRefs.current[order.id] = el; }}
                  className="bg-white rounded-2xl p-4 border border-border shadow-card hover:shadow-card-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-border-light">
                    <div className="flex flex-col">
                      <span className="font-bold text-primary text-sm">{order.orderNumber?.toString()}</span>
                      <span className="text-[10px] text-text-light">#{index + 1}</span>
                    </div>
                    <span className="text-xs text-text-light">
                      <i className="far fa-calendar-alt mr-1"></i>
                      {formatDateTime(order.createdAt)}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isFullyPacked ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                    }`}>
                      {isFullyPacked ? '✅ Ready' : '⏳ Packing'}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-user text-primary w-4"></i>
                      <span className="font-medium">{order.customer || 'Guest'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-light">
                      <i className="fas fa-map-marker-alt text-primary-light w-4"></i>
                      <span>{order.customerLocation} → {order.location}</span>
                    </div>
                  </div>

                  <div className="mt-3 max-h-[120px] overflow-y-auto bg-border-light/50 p-2 rounded-lg border border-border text-xs space-y-1">
                    {items.map((item, idx) => {
                      const packed = item.packed || 0;
                      const quantity = item.quantity || 0;
                      return (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                          <span className="text-text">{item.name} ({item.variant}) ×{quantity}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-text-light text-[10px]">{packed}/{quantity}</span>
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => handlePackToggle(order.id, idx)}
                                className="w-5 h-5 rounded bg-white border border-border flex items-center justify-center text-xs hover:bg-border-light transition-colors duration-200"
                                title="Toggle pack"
                              >
                                {packed >= quantity ? '✅' : '⬜'}
                              </button>
                              <button
                                onClick={() => handlePackAll(order.id, idx)}
                                className="w-5 h-5 rounded bg-success/20 border border-success flex items-center justify-center text-xs hover:bg-success/30 transition-colors duration-200"
                                title="Pack all"
                              >
                                <i className="fas fa-check-double text-success text-[8px]"></i>
                              </button>
                              <button
                                onClick={() => handleUnpackAll(order.id, idx)}
                                className="w-5 h-5 rounded bg-danger/20 border border-danger flex items-center justify-center text-xs hover:bg-danger/30 transition-colors duration-200"
                                title="Unpack all"
                              >
                                <i className="fas fa-undo text-danger text-[8px]"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-text-light mb-0.5">
                      <span>📦 Packed: {packedItems}/{totalItems}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, background: isFullyPacked ? '#1d6b44' : '#a64b2a' }}
                      ></div>
                    </div>
                  </div>

                  {/* Payment Section */}
                  <div className="mt-3 pt-2 border-t border-border-light">
                    <div className="flex justify-between text-sm">
                      <span>Total: <strong className="text-text">₹{totalAmount.toFixed(2)}</strong></span>
                      <span>Paid: <span className="text-success font-medium">₹{paidAmount.toFixed(2)}</span></span>
                      <span>Remaining: <span className={remaining > 0 ? 'text-danger font-medium' : 'text-success font-medium'}>
                        ₹{remaining.toFixed(2)}
                      </span></span>
                    </div>

                    {/* Payment Buttons */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {/* GPay Section */}
                      <div className="flex items-center gap-0.5 bg-border-light p-1 rounded-lg border border-border flex-wrap">
                        <span className="text-xs font-semibold text-[#1a73e8] px-1">
                          <i className="fas fa-google-pay"></i>
                        </span>
                        <span className="text-xs font-semibold text-[#1a73e8] min-w-[30px]">
                          ₹{order.paymentGPay?.toFixed(0) || 0}
                        </span>
                        <button
                          onClick={() => handleAddPayment(order.id, 'gpay', 10)}
                          className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px] hover:bg-border-light transition-colors"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleAddPayment(order.id, 'gpay', 50)}
                          className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px] hover:bg-border-light transition-colors"
                        >
                          +50
                        </button>
                        <button
                          onClick={() => {
                            const amt = prompt('Enter amount:', '10');
                            if (amt) handleAddPayment(order.id, 'gpay', parseFloat(amt));
                          }}
                          className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px] hover:bg-border-light transition-colors"
                        >
                          <i className="fas fa-pen text-[8px]"></i>
                        </button>
                        <button
                          onClick={() => handlePayFull(order.id, 'gpay')}
                          className="px-1.5 py-0.5 bg-[#1a73e8] text-white border border-[#1a73e8] rounded text-[10px] font-bold hover:opacity-80 transition-colors"
                        >
                          Full
                        </button>
                      </div>

                      {/* Cash Section */}
                      <div className="flex items-center gap-0.5 bg-border-light p-1 rounded-lg border border-border flex-wrap">
                        <span className="text-xs font-semibold text-success px-1">
                          <i className="fas fa-money-bill-wave"></i>
                        </span>
                        <span className="text-xs font-semibold text-success min-w-[30px]">
                          ₹{order.paymentCash?.toFixed(0) || 0}
                        </span>
                        <button
                          onClick={() => handleAddPayment(order.id, 'cash', 10)}
                          className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px] hover:bg-border-light transition-colors"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleAddPayment(order.id, 'cash', 50)}
                          className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px] hover:bg-border-light transition-colors"
                        >
                          +50
                        </button>
                        <button
                          onClick={() => {
                            const amt = prompt('Enter amount:', '10');
                            if (amt) handleAddPayment(order.id, 'cash', parseFloat(amt));
                          }}
                          className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px] hover:bg-border-light transition-colors"
                        >
                          <i className="fas fa-pen text-[8px]"></i>
                        </button>
                        <button
                          onClick={() => handlePayFull(order.id, 'cash')}
                          className="px-1.5 py-0.5 bg-success text-white border border-success rounded text-[10px] font-bold hover:opacity-80 transition-colors"
                        >
                          Full
                        </button>
                      </div>

                      <button
                        onClick={() => handleResetPayments(order.id)}
                        className="px-1.5 py-0.5 bg-[#f7e8d0] border border-border rounded text-[10px] hover:bg-[#f0dcc0] transition-colors"
                        title="Reset payments"
                      >
                        <i className="fas fa-undo text-warning"></i>
                      </button>

                      {/* Confirm Payment Button - Show when remaining = 0 and not confirmed */}
                      {remaining === 0 && !isPaymentConfirmed && (
                        <button
                          onClick={() => handleConfirmPayment(order.id)}
                          className="px-1.5 py-0.5 bg-[#d4a017] text-white border border-[#d4a017] rounded text-[10px] font-bold hover:opacity-80 transition-colors"
                        >
                          <i className="fas fa-check mr-0.5"></i> Confirm
                        </button>
                      )}

                      {/* Undo Payment Button - Show when confirmed */}
                      {isPaymentConfirmed && (
                        <button
                          onClick={() => handleUndoPayment(order.id)}
                          className="px-1.5 py-0.5 bg-[#f7e8d0] text-warning border border-warning rounded text-[10px] font-bold hover:opacity-80 transition-colors"
                        >
                          <i className="fas fa-undo mr-0.5"></i> Undo
                        </button>
                      )}

                      {/* Payment Status Badge */}
                      {isPaymentConfirmed && (
                        <span className="px-1.5 py-0.5 bg-success/20 text-success border border-success rounded text-[10px] font-bold">
                          ✅ Confirmed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="flex-1 py-1.5 rounded-lg bg-info text-white text-sm font-semibold hover:bg-info/80 transition-colors duration-200"
                    >
                      <i className="fas fa-eye mr-1"></i> View
                    </button>
                    <button
                      onClick={() => handleApprove(order.id)}
                      className="flex-1 py-1.5 rounded-lg bg-success text-white text-sm font-semibold hover:bg-success/80 transition-colors duration-200"
                    >
                      <i className="fas fa-check mr-1"></i> Approve
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      className="flex-1 py-1.5 rounded-lg bg-danger text-white text-sm font-semibold hover:bg-danger/80 transition-colors duration-200"
                    >
                      <i className="fas fa-times mr-1"></i> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <PopupModal
          isOpen={isOrderDetailsOpen}
          onClose={() => {
            setIsOrderDetailsOpen(false);
            setSelectedOrder(null);
          }}
          title={`Order Details - ${selectedOrder.orderNumber?.toString()}`}
          message=""
          type="info"
          showConfirm={false}
        >
          <div className="space-y-3">
            {/* Customer & Order Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-semibold">Order ID:</span> <span className="font-bold text-primary">{selectedOrder.orderNumber?.toString()}</span></div>
              <div><span className="font-semibold">Customer:</span> {selectedOrder.customer || 'Guest'}</div>
              <div><span className="font-semibold">Date & Time:</span> {formatDateTime(selectedOrder.createdAt)}</div>
              <div><span className="font-semibold">Location:</span> {selectedOrder.customerLocation}</div>
              <div><span className="font-semibold">Delivery Area:</span> {selectedOrder.location}</div>
              <div><span className="font-semibold">Status:</span> {selectedOrder.status}</div>
              <div><span className="font-semibold">Payment Confirmed:</span> {selectedOrder.paymentConfirmed ? '✅ Yes' : '⏳ No'}</div>
            </div>

            {/* Feedback Section */}
            {selectedOrder.feedback && (
              <div className="border-t border-border pt-3">
                <div className="flex items-start gap-2 bg-[#fcf7f2] p-3 rounded-lg border border-[#d4a017]">
                  <i className="fas fa-comment text-[#d4a017] text-sm mt-0.5"></i>
                  <div>
                    <span className="text-xs font-semibold text-text">Customer Feedback:</span>
                    <p className="text-sm text-text mt-0.5">{selectedOrder.feedback}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="border-t border-border pt-3">
              <h4 className="font-semibold text-sm mb-2">Payment Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm bg-background p-3 rounded-lg">
                <div>
                  <span className="text-text-light">Payment Method:</span>
                  <span className="ml-2 font-medium">
                    {selectedOrder.paymentMethod === 'gpay' ? 'GPay' :
                     selectedOrder.paymentMethod === 'cash' ? 'Cash' :
                     selectedOrder.paymentMethod === 'both' ? 'GPay + Cash' :
                     selectedOrder.paymentMethod === 'advance' ? 'Advance' :
                     selectedOrder.paymentMethod === 'unpaid' ? 'Unpaid (Bill)' :
                     'Not Selected'}
                  </span>
                </div>
                <div>
                  <span className="text-text-light">Total Amount:</span>
                  <span className="ml-2 font-bold text-primary">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-text-light">GPay Amount:</span>
                  <span className="ml-2 font-medium text-[#1a73e8]">₹{selectedOrder.paymentGPay?.toFixed(2) || '0.00'}</span>
                </div>
                <div>
                  <span className="text-text-light">Cash Amount:</span>
                  <span className="ml-2 font-medium text-success">₹{selectedOrder.paymentCash?.toFixed(2) || '0.00'}</span>
                </div>
                <div>
                  <span className="text-text-light">Advance Used:</span>
                  <span className="ml-2 font-medium text-info">₹{selectedOrder.advanceUsed?.toFixed(2) || '0.00'}</span>
                </div>
                <div>
                  <span className="text-text-light">Total Paid:</span>
                  <span className="ml-2 font-medium text-success">₹{((selectedOrder.paymentGPay || 0) + (selectedOrder.paymentCash || 0) + (selectedOrder.advanceUsed || 0)).toFixed(2)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-text-light">Pending Amount:</span>
                  <span className={`ml-2 font-bold ${getUnpaidAmount(selectedOrder) > 0 ? 'text-danger' : 'text-success'}`}>
                    ₹{getUnpaidAmount(selectedOrder).toFixed(2)}
                    {getUnpaidAmount(selectedOrder) <= 0 && ' ✅'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-border pt-3">
              <h4 className="font-semibold text-sm mb-2">Items:</h4>
              <div className="bg-background p-3 rounded-lg max-h-[150px] overflow-y-auto">
                {selectedOrder.items.map((item, idx) => {
                  const packed = item.packed || 0;
                  const quantity = item.quantity || 0;
                  const isFullyPacked = packed >= quantity;
                  return (
                    <div key={idx} className={`flex justify-between py-1 border-b border-border/50 last:border-0 text-sm ${isFullyPacked ? 'bg-success/10 px-2 rounded' : ''}`}>
                      <span>
                        {item.name} ({item.variant}) ×{quantity}
                        {isFullyPacked && ' ✅'}
                      </span>
                      <span className="font-semibold">₹{(item.price * quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtotal & Delivery */}
            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-danger">
                <span>Delivery:</span>
                <span>₹{selectedOrder.deliveryCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span>Total:</span>
                <span className="text-primary">₹{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </PopupModal>
      )}

      <Footer isAdmin />
    </div>
  );
}