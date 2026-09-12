'use client';

import { useState, useEffect } from 'react';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { Order, OrderItem } from '@/types';  // Add OrderItem import

// ============================================================
// LUNCH CATEGORY ID - Change this to your lunch category ID
// ============================================================
const LUNCH_CATEGORY_ID = 1; // Update this to match your lunch category ID

// ============================================================
// Helper Functions
// ============================================================

// Get all lunch products from storage
const getLunchProducts = () => {
  const products = storage.getProducts();
  return products.filter(p => p.categoryId === LUNCH_CATEGORY_ID);
};

// Get menu items for a specific date (based on products available that day)
const getMenuForDate = (orders: Order[], date: Date): { [key: string]: number } => {
  const dateStr = date.toISOString().split('T')[0];
  const lunchProducts = getLunchProducts();
  
  // Initialize counts for all lunch products
  const counts: { [key: string]: number } = {};
  lunchProducts.forEach(p => {
    counts[p.name] = 0;
  });
  
  // Filter orders for the specific date
  const dateOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
    return orderDate === dateStr;
  });
  
  // Count items from orders
  dateOrders.forEach(o => {
    (o.items || []).forEach((item: OrderItem) => {  // Add type annotation
      const itemName = item.name;
      const qty = item.quantity || 0;
      
      // Check if this item is a lunch product
      lunchProducts.forEach(lunchItem => {
        if (itemName.toLowerCase().includes(lunchItem.name.toLowerCase()) ||
            lunchItem.name.toLowerCase().includes(itemName.toLowerCase())) {
          counts[lunchItem.name] = (counts[lunchItem.name] || 0) + qty;
        }
      });
    });
  });
  
  return counts;
};

// Get date-wise stats for a specific date
const getDateWiseStats = (orders: Order[], date: Date) => {
  const dateStr = date.toISOString().split('T')[0];
  const dateOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
    return orderDate === dateStr;
  });
  
  const totalOrders = dateOrders.length;
  const approvedOrders = dateOrders.filter(o => o.status === 'completed').length;
  const pendingOrders = dateOrders.filter(o => o.status === 'pending').length;
  const unapprovedOrders = dateOrders.filter(o => o.status === 'pending' || o.status === 'rejected').length;
  const totalRevenue = dateOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  let paidAmount = 0;
  let unpaidAmount = 0;
  let pendingAmount = 0;
  
  dateOrders.forEach(o => {
    const paid = (o.paymentGPay || 0) + (o.paymentCash || 0) + (o.advanceUsed || 0);
    const total = o.total || 0;
    const pending = total - paid;
    
    paidAmount += paid;
    unpaidAmount += pending > 0 ? pending : 0;
    pendingAmount += pending;
  });
  
  return {
    totalOrders,
    approvedOrders,
    pendingOrders,
    unapprovedOrders,
    totalRevenue,
    paidAmount,
    unpaidAmount,
    pendingAmount,
  };
};

// ============================================================
// Main Dashboard Component
// ============================================================

export default function AdminDashboard() {
  const [dateStats, setDateStats] = useState({
    totalOrders: 0,
    approvedOrders: 0,
    pendingOrders: 0,
    unapprovedOrders: 0,
    totalRevenue: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    pendingAmount: 0,
  });
  
  const [allStats, setAllStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    unapprovedOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCategories: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    pendingAmount: 0,
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lunchCounts, setLunchCounts] = useState<{ [key: string]: number }>({});
  const [allLunchProducts, setAllLunchProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lunchCategory, setLunchCategory] = useState<any>(null);

  // Load data on mount and when date changes
  useEffect(() => {
    loadAllData();
  }, [selectedDate]);

  const loadAllData = () => {
    setIsLoading(true);
    
    try {
      const orders = storage.getOrders();
      const products = storage.getProducts();
      const categories = storage.getCategories();
      
      // Find lunch category
      const lunchCat = categories.find(c => 
        c.name.toLowerCase().includes('lunch') || 
        c.id === LUNCH_CATEGORY_ID
      );
      setLunchCategory(lunchCat);
      
      // Get all lunch products
      const lunchProducts = getLunchProducts();
      const lunchProductNames = lunchProducts.map(p => p.name);
      setAllLunchProducts(lunchProductNames);
      
      // All-time Stats
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const approvedOrders = orders.filter(o => o.status === 'completed').length;
      const unapprovedOrders = orders.filter(o => o.status === 'pending' || o.status === 'rejected').length;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      let paidAmount = 0;
      let unpaidAmount = 0;
      let pendingAmount = 0;
      
      orders.forEach(o => {
        const paid = (o.paymentGPay || 0) + (o.paymentCash || 0) + (o.advanceUsed || 0);
        const total = o.total || 0;
        const pending = total - paid;
        
        paidAmount += paid;
        unpaidAmount += pending > 0 ? pending : 0;
        pendingAmount += pending;
      });
      
      setAllStats({
        totalOrders,
        pendingOrders,
        approvedOrders,
        unapprovedOrders,
        totalRevenue,
        totalProducts: products.length,
        totalCategories: categories.length,
        paidAmount,
        unpaidAmount,
        pendingAmount,
      });
      
      // Date-wise Stats for selected date
      const dateStats = getDateWiseStats(orders, selectedDate);
      setDateStats(dateStats);
      
      // Get menu counts for selected date
      const counts = getMenuForDate(orders, selectedDate);
      setLunchCounts(counts);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setSelectedDate(date);
    }
  };

  // Format date for display
  const formatDisplayDate = (date: Date) => {
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

  const getDayName = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Calculate total items sold for the selected date
  const getTotalItemsSold = () => {
    return Object.values(lunchCounts).reduce((sum, val) => sum + val, 0);
  };

  // Get all menu items
  const getAllMenuItems = () => {
    return Object.keys(lunchCounts);
  };

  // Get today's date for display
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-chart-pie text-secondary"></i>
            Dashboard
          </h2>
          <div className="flex items-center gap-2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border shadow-sm">
            <i className="far fa-calendar-alt text-primary-light"></i>
            <span className="text-xs sm:text-sm text-text-muted">{today}</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* DATE WISE STATS HEADER */}
        {/* ============================================================ */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white rounded-2xl p-3 sm:p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <i className="fas fa-calendar-day text-primary-light"></i>
            <span className="text-sm font-medium text-text">
              Date-wise Stats: 
              <span className="ml-1 font-bold text-primary">{formatDisplayDate(selectedDate)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={goToPreviousDay}
              className="px-2 py-1 border border-border rounded-lg text-sm hover:bg-border-light transition-colors"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="px-2 py-1 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 w-36"
            />
            <button 
              onClick={goToNextDay}
              className="px-2 py-1 border border-border rounded-lg text-sm hover:bg-border-light transition-colors"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            <button 
              onClick={goToToday}
              className="px-3 py-1 border border-border rounded-lg text-sm bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROW 1: Date-wise Basic Stats */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <i className="fas fa-shopping-bag text-lg sm:text-xl"></i>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{dateStats.totalOrders}</div>
                <div className="text-[10px] sm:text-xs text-text-light font-medium">Total Orders</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                <i className="fas fa-check-circle text-lg sm:text-xl"></i>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{dateStats.approvedOrders}</div>
                <div className="text-[10px] sm:text-xs text-text-light font-medium">Approved Orders</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                <i className="fas fa-clock text-lg sm:text-xl"></i>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{dateStats.pendingOrders}</div>
                <div className="text-[10px] sm:text-xs text-text-light font-medium">Pending Orders</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                <i className="fas fa-times-circle text-lg sm:text-xl"></i>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{dateStats.unapprovedOrders}</div>
                <div className="text-[10px] sm:text-xs text-text-light font-medium">Unapproved Orders</div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROW 2: Date-wise Revenue & Payments */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <i className="fas fa-rupee-sign text-lg sm:text-xl"></i>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">₹{dateStats.totalRevenue.toFixed(0)}</div>
                <div className="text-[10px] sm:text-xs text-text-light font-medium">Total Revenue</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                <i className="fas fa-money-bill-wave text-lg sm:text-xl"></i>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">₹{dateStats.paidAmount.toFixed(0)}</div>
                <div className="text-[10px] sm:text-xs text-text-light font-medium">Paid Amount</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                <i className="fas fa-exclamation-circle text-lg sm:text-xl"></i>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">₹{dateStats.unpaidAmount.toFixed(0)}</div>
                <div className="text-[10px] sm:text-xs text-text-light font-medium">Unpaid Amount</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                <i className="fas fa-hourglass-half text-lg sm:text-xl"></i>
              </div>
              <div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">₹{dateStats.pendingAmount.toFixed(0)}</div>
                <div className="text-[10px] sm:text-xs text-text-light font-medium">Pending Amount</div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROW 3: All-Time Stats */}
        {/* ============================================================ */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-chart-line text-primary-light"></i>
            <h3 className="text-sm font-semibold text-text">All-Time Stats</h3>
            <span className="text-xs text-text-light">(Since beginning)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                  <i className="fas fa-shopping-bag text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{allStats.totalOrders}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Total Orders</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success/5 flex items-center justify-center text-success">
                  <i className="fas fa-check-circle text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{allStats.approvedOrders}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Approved Orders</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warning/5 flex items-center justify-center text-warning">
                  <i className="fas fa-clock text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{allStats.pendingOrders}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Pending Orders</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-danger/5 flex items-center justify-center text-danger">
                  <i className="fas fa-times-circle text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{allStats.unapprovedOrders}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Unapproved Orders</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                  <i className="fas fa-rupee-sign text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">₹{allStats.totalRevenue.toFixed(0)}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Total Revenue</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-success/5 flex items-center justify-center text-success">
                  <i className="fas fa-money-bill-wave text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">₹{allStats.paidAmount.toFixed(0)}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Paid Amount</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-danger/5 flex items-center justify-center text-danger">
                  <i className="fas fa-exclamation-circle text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">₹{allStats.unpaidAmount.toFixed(0)}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Unpaid Amount</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warning/5 flex items-center justify-center text-warning">
                  <i className="fas fa-hourglass-half text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">₹{allStats.pendingAmount.toFixed(0)}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Pending Amount</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-info/5 flex items-center justify-center text-info">
                  <i className="fas fa-boxes text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{allStats.totalProducts}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Total Products</div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 rounded-2xl p-4 sm:p-5 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#d4a017]/5 flex items-center justify-center text-[#d4a017]">
                  <i className="fas fa-tags text-lg sm:text-xl"></i>
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">{allStats.totalCategories}</div>
                  <div className="text-[10px] sm:text-xs text-text-light font-medium">Total Categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROW 4: Lunch Items with Date Navigation */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-border shadow-sm">
          {/* Header with Date Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <i className="fas fa-utensils text-primary-light text-lg"></i>
              <h3 className="text-base sm:text-lg font-semibold text-text">
                Lunch Menu Sales
              </h3>
              <span className="text-xs text-text-light">({formatDisplayDate(selectedDate)})</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Total: {getTotalItemsSold()} items
              </span>
              {lunchCategory && (
                <span className="text-xs bg-border px-2 py-0.5 rounded-full text-text-light">
                  {lunchCategory.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={goToPreviousDay}
                className="px-2 py-1 border border-border rounded-lg text-sm hover:bg-border-light transition-colors"
                title="Previous Day"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={handleDateChange}
                className="px-2 py-1 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 w-36"
              />
              
              <button 
                onClick={goToNextDay}
                className="px-2 py-1 border border-border rounded-lg text-sm hover:bg-border-light transition-colors"
                title="Next Day"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
              
              <button 
                onClick={goToToday}
                className="px-3 py-1 border border-border rounded-lg text-sm bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                Today
              </button>
            </div>
          </div>
          
          {/* Menu Items Grid */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
            </div>
          ) : getAllMenuItems().length === 0 ? (
            <div className="text-center py-8 text-text-light">
              <i className="fas fa-utensils text-3xl block mb-2 text-border"></i>
              No lunch products found in the system. 
              <br />
              <span className="text-xs">Add products to the "Lunch" category to see them here.</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {getAllMenuItems().map((itemName) => {
                  const count = lunchCounts[itemName] || 0;
                  const hasSales = count > 0;
                  
                  return (
                    <div 
                      key={itemName} 
                      className={`rounded-xl p-3 sm:p-4 text-center border transition-all duration-300 ${
                        hasSales 
                          ? 'bg-background border-border/50 hover:shadow-card' 
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className={`text-2xl sm:text-3xl font-bold ${hasSales ? 'text-primary' : 'text-gray-400'}`}>
                        {count}
                      </div>
                      <div className={`text-[10px] sm:text-xs font-medium mt-0.5 ${hasSales ? 'text-text-light' : 'text-gray-400'}`}>
                        {itemName}
                      </div>
                      {!hasSales && (
                        <div className="text-[8px] text-gray-400 mt-0.5">No sales</div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-light border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-background border border-border/50"></div>
                  <span>Has sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200"></div>
                  <span>No sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-info-circle text-xs"></i>
                  <span>Items shown from <strong>{lunchCategory?.name || 'Lunch'}</strong> category</span>
                </div>
              </div>
              
              {/* If no items sold */}
              {getTotalItemsSold() === 0 && getAllMenuItems().length > 0 && (
                <div className="mt-4 text-center text-sm text-text-light">
                  <i className="fas fa-info-circle mr-1"></i>
                  No sales recorded for {getDayName(selectedDate)} on {formatDisplayDate(selectedDate)}.
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer isAdmin />
    </div>
  );
}