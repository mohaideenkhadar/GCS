'use client';

import { useState, useEffect } from 'react';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { Order, Offer } from '@/types';
import { 
  getPaymentStatusLabel, 
  getPaymentStatusColor, 
  getUnpaidAmount, 
  formatDateTime,
  getDateOnly,
  COLLECTION_SHORT,
  COLLECTION_COLORS,
  generateUniqueOrderId
} from '@/utils/helpers';
import { useToast } from '@/hooks/useToast';
import { PopupModal } from '@/components/common/PopupModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [customers, setCustomers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Special Order Modal States
  const [isSpecialOrderModalOpen, setIsSpecialOrderModalOpen] = useState(false);
  const [specialCustomerName, setSpecialCustomerName] = useState('');
  const [specialBlkNo, setSpecialBlkNo] = useState('');
  const [specialLocation, setSpecialLocation] = useState('');
  const [specialDescription, setSpecialDescription] = useState('');
  const [specialProducts, setSpecialProducts] = useState<Array<{ productId: number; variantIndex: number; qty: number; price: number }>>([]);
  const [specialDeliveryDate, setSpecialDeliveryDate] = useState('');
  const [specialPaymentMethod, setSpecialPaymentMethod] = useState('cash');
  const [specialTotal, setSpecialTotal] = useState(0);
  
  // Walk-in Modal States
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinBlkNo, setWalkinBlkNo] = useState('');
  const [walkinLocation, setWalkinLocation] = useState('');
  const [walkinProducts, setWalkinProducts] = useState<Array<{ productId: number; variantIndex: number; qty: number; price: number }>>([]);
  const [walkinPaymentMethod, setWalkinPaymentMethod] = useState('cash');
  const [walkinTotal, setWalkinTotal] = useState(0);
  
  // Advance Payment Modal States
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceCustomer, setAdvanceCustomer] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceMethod, setAdvanceMethod] = useState('cash');
  const [advanceNotes, setAdvanceNotes] = useState('');
  
  // Customer Bill Modal
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billCustomer, setBillCustomer] = useState('');
  const [billStartDate, setBillStartDate] = useState('');
  const [billEndDate, setBillEndDate] = useState('');
  const [billOrderType, setBillOrderType] = useState('all');
  
  // Reminder Modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminders, setReminders] = useState<Array<{ order: Order; days: number; pendingAmount: number }>>([]);  
  // Products for dropdowns
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const allOrders = storage.getOrders();
    setOrders(allOrders);
    setOffers(storage.getOffers());
    setProducts(storage.getProducts());
    
    const uniqueCustomers = [...new Set(allOrders.map(o => o.customer).filter(Boolean))];
    setCustomers(uniqueCustomers);
  };

  // Date Range Filter
  const getDateFilteredOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = new Date(today);
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch(dateRange) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last90':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'last180':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 180);
        break;
      case 'last365':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 365);
        break;
      case 'custom':
        if (customDate) {
          return orders.filter(o => getDateOnly(o.createdAt) === customDate);
        }
        return orders;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
    }

    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  const getFilteredOrders = () => {
    let filtered = getDateFilteredOrders();

    // Search by Order ID, Customer Name, or Location
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => {
        // Convert orderNumber to string if it exists
        const orderNumberStr = o.orderNumber ? String(o.orderNumber) : '';
        const customerStr = o.customer || '';
        const locationStr = o.customerLocation || '';
        
        return orderNumberStr.toLowerCase().includes(term) ||
          customerStr.toLowerCase().includes(term) ||
          locationStr.toLowerCase().includes(term);
      });
    }

    // Status filters
    if (filter === 'pending') filtered = filtered.filter(o => o.status === 'pending');
    else if (filter === 'completed') filtered = filtered.filter(o => o.status === 'completed');
    else if (filter === 'rejected') filtered = filtered.filter(o => o.status === 'rejected');
    else if (filter === 'awaiting_payment') {
      filtered = filtered.filter(o => getPaymentStatusLabel(o).includes('Awaiting'));
    } else if (filter === 'payment_received') {
      filtered = filtered.filter(o => getPaymentStatusLabel(o).includes('Received'));
    } else if (filter === 'bill_pending') {
      filtered = filtered.filter(o => getPaymentStatusLabel(o).includes('Bill'));
    } else if (filter === 'paid') {
      filtered = filtered.filter(o => getPaymentStatusLabel(o).includes('Fully Paid'));
    } else if (filter === 'reminder') {
      const reminderOrders = getReminderOrders();
      const reminderIds = reminderOrders.map(r => r.order.id);
      filtered = filtered.filter(o => reminderIds.includes(o.id));
    } else if (filter === 'pickup') {
      filtered = filtered.filter(o => o.collectionMethod === 'pickup');
    } else if (filter === 'delivery') {
      filtered = filtered.filter(o => o.collectionMethod === 'delivery');
    } else if (filter === 'store') {
      filtered = filtered.filter(o => o.collectionMethod === 'store');
    } else if (filter === 'offer') {
      filtered = filtered.filter(o => o.isOffer === true);
    } else if (filter === 'special') {
      filtered = filtered.filter(o => o.isSpecial === true || o.collectionMethod === 'special');
    } else if (filter === 'walkin') {
      filtered = filtered.filter(o => o.isWalkin === true || o.collectionMethod === 'walkin');
    }

    return filtered;
  };

  // Reminder Functions
  const getReminderOrders = () => {
    const today = new Date();
    const reminderDays = 30;
    const reminders: Array<{ order: Order; days: number; pendingAmount: number }> = [];
    
    orders.forEach(o => {
      const orderDate = new Date(o.createdAt);
      const daysDiff = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      const pendingAmount = getUnpaidAmount(o);
      
      if (pendingAmount > 0 && daysDiff >= reminderDays) {
        reminders.push({
          order: o,
          days: daysDiff,
          pendingAmount: pendingAmount
        });
      }
    });
    return reminders;
  };

  const handleOpenReminders = () => {
    setReminders(getReminderOrders());
    setIsReminderModalOpen(true);
  };

  // PDF Download Functions
  const handleDownloadPDF = (type: 'lunch' | 'other') => {
    const filteredOrders = getFilteredOrders();
    let typeOrders = filteredOrders;
    
    if (type === 'lunch') {
      typeOrders = filteredOrders.filter(o => {
        const items = o.items || [];
        return items.some(item => 
          ['Sambar', 'Rasam', 'Curry', 'Kootu', 'Veg Biriyani', 'Vadai'].some(
            lunch => item.name.toLowerCase().includes(lunch.toLowerCase())
          )
        );
      });
    } else {
      typeOrders = filteredOrders.filter(o => {
        const items = o.items || [];
        return !items.some(item => 
          ['Sambar', 'Rasam', 'Curry', 'Kootu', 'Veg Biriyani', 'Vadai'].some(
            lunch => item.name.toLowerCase().includes(lunch.toLowerCase())
          )
        );
      });
    }

    if (typeOrders.length === 0) {
      toast.error('No Orders', `No ${type} orders found for selected date range.`);
      return;
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      doc.setFontSize(16);
      doc.setTextColor(166, 75, 42);
      doc.text(`Gayathri Homely Delights - ${type.toUpperCase()} Orders`, 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Date Range: ${dateRange}`, 14, 28);
      doc.text(`Total Orders: ${typeOrders.length}`, 14, 34);

      const tableData = typeOrders.map((order, index) => {
        const items = order.items || [];
        const itemsList = items.map(item => {
          const variant = item.variant || '';
          return variant ? `${item.name} (${variant}) ×${item.quantity}` : `${item.name} ×${item.quantity}`;
        }).join(', ');
        
        return [
          order.orderNumber?.toString() || 'N/A',
          order.customer || 'Guest',
          order.collectionMethod || 'pickup',
          new Date(order.createdAt).toLocaleDateString('en-IN'),
          itemsList,
          `₹${order.total.toFixed(2)}`,
          `₹${((order.paymentGPay || 0) + (order.paymentCash || 0) + (order.advanceUsed || 0)).toFixed(2)}`,
          `₹${getUnpaidAmount(order).toFixed(2)}`
        ];
      });

      const totalAmount = typeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalPaid = typeOrders.reduce((sum, o) => sum + (o.paymentGPay || 0) + (o.paymentCash || 0) + (o.advanceUsed || 0), 0);
      const totalPending = totalAmount - totalPaid;
      
      tableData.push([
        'TOTAL',
        '',
        '',
        '',
        '',
        `₹${totalAmount.toFixed(2)}`,
        `₹${totalPaid.toFixed(2)}`,
        `₹${totalPending.toFixed(2)}`
      ]);

      autoTable(doc, {
        head: [['Order ID', 'Customer', 'Collection', 'Date', 'Items', 'Total', 'Paid', 'Pending']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: {
          fillColor: [166, 75, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 50 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 20 }
        },
        margin: { left: 10, right: 10 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.cell.raw === 'TOTAL') {
            data.cell.styles.fillColor = [245, 235, 220];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      const fileName = `${type}_orders_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('PDF Downloaded', `✅ ${type.toUpperCase()} PDF downloaded successfully!`);
    } catch (error) {
      toast.error('PDF Error', 'Error generating PDF. Please try again.');
      console.error('PDF Error:', error);
    }
  };

  // Customer Bill
  const handleOpenBillModal = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setBillStartDate(firstDay.toISOString().split('T')[0]);
    setBillEndDate(today.toISOString().split('T')[0]);
    setBillCustomer('');
    setBillOrderType('all');
    setIsBillModalOpen(true);
  };

  const handleGenerateBill = () => {
    if (!billCustomer) {
      toast.error('Missing Information', 'Please select a customer.');
      return;
    }
    if (!billStartDate || !billEndDate) {
      toast.error('Missing Information', 'Please select start and end dates.');
      return;
    }
    if (billStartDate > billEndDate) {
      toast.error('Invalid Date', 'Start date cannot be after end date.');
      return;
    }

    let customerOrders = orders.filter(o => {
      if (o.customer !== billCustomer) return false;
      const orderDate = new Date(o.createdAt);
      const start = new Date(billStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(billEndDate);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    });

    if (billOrderType === 'paid') {
      customerOrders = customerOrders.filter(o => getUnpaidAmount(o) <= 0);
    } else if (billOrderType === 'unpaid') {
      customerOrders = customerOrders.filter(o => getUnpaidAmount(o) > 0);
    }

    if (customerOrders.length === 0) {
      toast.error('No Orders', 'No orders found for the selected criteria.');
      return;
    }

    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.setTextColor(166, 75, 42);
      doc.text('Gayathri Homely Delights', 14, 25);
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text(`Customer Statement - ${billOrderType.toUpperCase()} Orders`, 14, 35);
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Customer: ${billCustomer}`, 14, 45);
      doc.text(`Period: ${new Date(billStartDate).toLocaleDateString('en-IN')} to ${new Date(billEndDate).toLocaleDateString('en-IN')}`, 14, 52);
      doc.text(`Total Orders: ${customerOrders.length}`, 14, 59);

      const tableData = customerOrders.map((order, index) => {
        const items = order.items || [];
        const itemsList = items.map(item => {
          const variant = item.variant || '';
          return variant ? `${item.name} (${variant}) ×${item.quantity}` : `${item.name} ×${item.quantity}`;
        }).join(', ');
        
        const total = order.total || 0;
        const paid = (order.paymentGPay || 0) + (order.paymentCash || 0) + (order.advanceUsed || 0);
        const pending = total - paid;
        
        return [
          order.orderNumber?.toString() || 'N/A',
          new Date(order.createdAt).toLocaleDateString('en-IN'),
          itemsList,
          `₹${total.toFixed(2)}`,
          `₹${paid.toFixed(2)}`,
          `₹${pending.toFixed(2)}`,
          pending > 0 ? '⚠️ Pending' : '✅ Paid'
        ];
      });

      const totalAmount = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalPaid = customerOrders.reduce((sum, o) => sum + (o.paymentGPay || 0) + (o.paymentCash || 0) + (o.advanceUsed || 0), 0);
      const totalPending = totalAmount - totalPaid;
      
      tableData.push([
        'TOTAL',
        '',
        '',
        `₹${totalAmount.toFixed(2)}`,
        `₹${totalPaid.toFixed(2)}`,
        `₹${totalPending.toFixed(2)}`,
        ''
      ]);

      autoTable(doc, {
        head: [['Order ID', 'Date', 'Items', 'Total', 'Paid', 'Pending', 'Status']],
        body: tableData,
        startY: 65,
        theme: 'grid',
        headStyles: {
          fillColor: [166, 75, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 50 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 },
          6: { cellWidth: 20 }
        },
        margin: { left: 14, right: 14 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.cell.raw === 'TOTAL') {
            data.cell.styles.fillColor = [245, 235, 220];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      const fileName = `statement_${billCustomer}_${billStartDate}_to_${billEndDate}.pdf`;
      doc.save(fileName);
      toast.success('Statement Downloaded', `✅ Statement for ${billCustomer} downloaded successfully!`);
      setIsBillModalOpen(false);
    } catch (error) {
      toast.error('Bill Error', 'Error generating bill. Please try again.');
      console.error('Bill Error:', error);
    }
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

    if (!confirm(`Confirm payment for order ${order.orderNumber?.toString()}?`)) return;

    order.paymentConfirmed = true;
    storage.setOrders(allOrders);
    loadData();
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
    loadData();
    toast.info('Payment Unconfirmed', `⏳ Payment confirmation for order ${order.orderNumber?.toString()} has been undone.`);
  };

  // View Order Details
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  // ==================== SPECIAL ORDER FUNCTIONS ====================
  const handleOpenSpecialOrderModal = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    setSpecialDeliveryDate(deliveryDate.toISOString().split('T')[0]);
    setSpecialCustomerName('');
    setSpecialBlkNo('');
    setSpecialLocation('');
    setSpecialDescription('');
    setSpecialPaymentMethod('cash');
    setSpecialProducts([{ productId: 0, variantIndex: 0, qty: 1, price: 0 }]);
    setSpecialTotal(0);
    setIsSpecialOrderModalOpen(true);
  };

  const handleAddSpecialProduct = () => {
    setSpecialProducts([...specialProducts, { productId: 0, variantIndex: 0, qty: 1, price: 0 }]);
  };

  const handleRemoveSpecialProduct = (index: number) => {
    if (specialProducts.length <= 1) {
      toast.error('Invalid', 'You must have at least one product.');
      return;
    }
    setSpecialProducts(specialProducts.filter((_, i) => i !== index));
  };

  const handleSpecialProductChange = (index: number, field: string, value: any) => {
    const updated = [...specialProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSpecialProducts(updated);
    calculateSpecialTotal(updated);
  };

  const calculateSpecialTotal = (productsList: any[]) => {
    let total = 0;
    productsList.forEach(item => {
      total += (item.price || 0) * (item.qty || 0);
    });
    setSpecialTotal(total);
  };

  const handleSaveSpecialOrder = () => {
    if (!specialCustomerName.trim()) {
      toast.error('Missing Information', 'Please enter customer name.');
      return;
    }
    if (!specialDescription.trim()) {
      toast.error('Missing Information', 'Please enter special order description.');
      return;
    }

    const items = specialProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      const variant = product?.variants[item.variantIndex];
      return {
        productId: item.productId,
        name: product?.name || 'Unknown',
        variant: variant?.weight || 'Unknown',
        quantity: item.qty,
        price: item.price,
      };
    });

    const orders = storage.getOrders();
    const nextOrderNumber = orders.length + 1;

    const order: Order = {  // Add explicit type
      id: Date.now() + 1000 + Math.floor(Math.random() * 1000),
      orderNumber: generateUniqueOrderId(), // Returns string - correct
      customer: specialCustomerName.trim(),
      customerLocation: specialBlkNo ? `${specialCustomerName.trim()}, ${specialBlkNo.trim()}` : specialCustomerName.trim(),
      location: specialLocation.trim() || 'Store',
      collectionMethod: 'special' as const,
      deliveryCharge: 0,
      subtotal: specialTotal,
      total: specialTotal,
      items: items,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      paymentGPay: 0,
      paymentCash: 0,
      advanceUsed: 0,
      isSpecial: true,
      specialDescription: specialDescription.trim(),
      specialDeliveryDate: specialDeliveryDate || null,
      paymentMethod: specialPaymentMethod,
      paymentConfirmed: false,
    };

    orders.unshift(order);
    storage.setOrders(orders);
    loadData();
    setIsSpecialOrderModalOpen(false);
    toast.success('Special Order Saved', `⭐ Special order for "${specialCustomerName}" saved successfully!`);
  };

  // ==================== WALK-IN ORDER FUNCTIONS ====================
  const handleOpenWalkinModal = () => {
    setWalkinName('');
    setWalkinBlkNo('');
    setWalkinLocation('');
    setWalkinPaymentMethod('cash');
    setWalkinProducts([{ productId: 0, variantIndex: 0, qty: 1, price: 0 }]);
    setWalkinTotal(0);
    setIsWalkinModalOpen(true);
  };

  const handleAddWalkinProduct = () => {
    setWalkinProducts([...walkinProducts, { productId: 0, variantIndex: 0, qty: 1, price: 0 }]);
  };

  const handleRemoveWalkinProduct = (index: number) => {
    if (walkinProducts.length <= 1) {
      toast.error('Invalid', 'You must have at least one product.');
      return;
    }
    setWalkinProducts(walkinProducts.filter((_, i) => i !== index));
  };

  const handleWalkinProductChange = (index: number, field: string, value: any) => {
    const updated = [...walkinProducts];
    updated[index] = { ...updated[index], [field]: value };
    setWalkinProducts(updated);
    calculateWalkinTotal(updated);
  };

  const calculateWalkinTotal = (productsList: any[]) => {
    let total = 0;
    productsList.forEach(item => {
      total += (item.price || 0) * (item.qty || 0);
    });
    setWalkinTotal(total);
  };

  const handleSaveWalkinOrder = () => {
    if (!walkinName.trim()) {
      toast.error('Missing Information', 'Please enter customer name.');
      return;
    }

    const items = walkinProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      const variant = product?.variants[item.variantIndex];
      return {
        productId: item.productId,
        name: product?.name || 'Unknown',
        variant: variant?.weight || 'Unknown',
        quantity: item.qty,
        price: item.price,
      };
    });

    const orders = storage.getOrders();
    const nextOrderNumber = orders.length + 1;

    let paymentGPay = 0;
    let paymentCash = 0;
    if (walkinPaymentMethod === 'cash') paymentCash = walkinTotal;
    else if (walkinPaymentMethod === 'gpay') paymentGPay = walkinTotal;
    else if (walkinPaymentMethod === 'both') {
      paymentGPay = walkinTotal / 2;
      paymentCash = walkinTotal / 2;
    }

    const order: Order = {  // Add explicit type
      id: Date.now() + 1000 + Math.floor(Math.random() * 1000),
      orderNumber: generateUniqueOrderId(), // Returns string - correct
      customer: walkinName.trim(),
      customerLocation: walkinBlkNo ? `${walkinName.trim()}, ${walkinBlkNo.trim()}` : walkinName.trim(),
      location: walkinLocation.trim() || 'Store',
      collectionMethod: 'walkin' as const,
      deliveryCharge: 0,
      subtotal: walkinTotal,
      total: walkinTotal,
      items: items,
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
      paymentGPay,
      paymentCash,
      advanceUsed: 0,
      isWalkin: true,
      paymentMethod: walkinPaymentMethod,
      paymentConfirmed: false,
    };

    orders.unshift(order);
    storage.setOrders(orders);
    loadData();
    setIsWalkinModalOpen(false);
    toast.success('Walk-in Order Saved', `🚶 Walk-in order for "${walkinName}" saved successfully!`);
  };

  // ==================== ADVANCE PAYMENT FUNCTIONS ====================
  const handleOpenAdvanceModal = () => {
    setAdvanceCustomer('');
    setAdvanceAmount('');
    setAdvanceMethod('cash');
    setAdvanceNotes('');
    setIsAdvanceModalOpen(true);
  };

  const handleSaveAdvance = () => {
    if (!advanceCustomer.trim()) {
      toast.error('Missing Information', 'Please select a customer.');
      return;
    }
    const amount = parseFloat(advanceAmount);
    if (!amount || amount <= 0) {
      toast.error('Invalid Amount', 'Please enter a valid advance amount.');
      return;
    }

    const advances = storage.getAdvances();
    advances.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      customer: advanceCustomer.trim(),
      amount: amount,
      method: advanceMethod,
      notes: advanceNotes.trim() || 'Advance payment',
      date: new Date().toISOString(),
    });
    storage.setAdvances(advances);
    loadData();
    setIsAdvanceModalOpen(false);
    toast.success('Advance Payment Recorded', `✅ Advance payment of ₹${amount.toFixed(2)} recorded for ${advanceCustomer}!`);
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

  const filteredOrders = getFilteredOrders();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-box text-secondary"></i>
            All Orders
            <span className="text-sm font-normal text-text-light ml-2">
              ({filteredOrders.length} orders)
            </span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {/* Special Button */}
            <button
              onClick={handleOpenSpecialOrderModal}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#a86f2c] text-white hover:bg-[#a86f2c]/80 transition-colors"
            >
              <i className="fas fa-star mr-1"></i> Special
            </button>
            {/* Walk-in Button */}
            <button
              onClick={handleOpenWalkinModal}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#a64b2a] text-white hover:bg-[#a64b2a]/80 transition-colors"
            >
              <i className="fas fa-user-plus mr-1"></i> Walk-in
            </button>
            {/* Advance Button */}
            <button
              onClick={handleOpenAdvanceModal}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#2a5f7a] text-white hover:bg-[#2a5f7a]/80 transition-colors"
            >
              <i className="fas fa-money-bill-wave mr-1"></i> Advance
            </button>
            {/* Lunch PDF */}
            <button
              onClick={() => handleDownloadPDF('lunch')}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#2a5f7a] text-white hover:bg-[#2a5f7a]/80 transition-colors"
            >
              <i className="fas fa-file-pdf mr-1"></i> Lunch PDF
            </button>
            {/* Other PDF */}
            <button
              onClick={() => handleDownloadPDF('other')}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#a86f2c] text-white hover:bg-[#a86f2c]/80 transition-colors"
            >
              <i className="fas fa-file-pdf mr-1"></i> Other PDF
            </button>
            {/* Customer Bill */}
            <button
              onClick={handleOpenBillModal}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#a64b2a] text-white hover:bg-[#a64b2a]/80 transition-colors"
            >
              <i className="fas fa-user mr-1"></i> Customer Bill
            </button>
            {/* Reminders */}
            <button
              onClick={handleOpenReminders}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#d9534f] text-white hover:bg-[#d9534f]/80 transition-colors relative"
            >
              <i className="fas fa-bell mr-1"></i> Reminders
              {getReminderOrders().length > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#d9534f] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {getReminderOrders().length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar - Added after header */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
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
            {getFilteredOrders().length} results
          </span>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 1 Month</option>
            <option value="last90">Last 3 Months</option>
            <option value="last180">Last 6 Months</option>
            <option value="last365">Last 1 Year</option>
            <option value="custom">Custom Date</option>
          </select>
          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => setCustomDate('')}
                className="px-2 py-1.5 border border-border rounded-lg text-sm hover:bg-border-light transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {['all', 'pending', 'completed', 'rejected', 'awaiting_payment', 'payment_received', 'bill_pending', 'paid', 'reminder', 'pickup', 'delivery', 'store', 'offer', 'special', 'walkin'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 capitalize ${
                filter === f
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white border border-border hover:bg-border-light text-text'
              }`}
            >
              {f === 'awaiting_payment' ? '⏳ Awaiting Payment' :
               f === 'payment_received' ? '✅ Payment Received' :
               f === 'bill_pending' ? '📝 Bill Pending' :
               f === 'paid' ? '💚 Fully Paid' :
               f === 'reminder' ? '🔔 Reminder' :
               f === 'offer' ? '📢 Offer' :
               f === 'special' ? '⭐ Special' :
               f === 'walkin' ? '🚶 Walk-in' :
               f}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-border shadow-card overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <i className="fas fa-box-open text-4xl sm:text-5xl text-border block mb-3"></i>
              <p className="text-text-light">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Order ID</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">#</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Customer</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Type</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Items</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Packed</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Date</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Total</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Paid</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Pending</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Payment Status</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Status</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => {
                    const items = order.items || [];
                    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
                    const packedItems = items.reduce((sum, i) => sum + (i.packed || 0), 0);
                    const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
                    const isFullyPacked = progress === 100 && totalItems > 0;
                    const paymentStatus = getPaymentStatusLabel(order);
                    const paymentColor = getPaymentStatusColor(order);
                    const pendingAmount = getUnpaidAmount(order);
                    const totalPaid = (order.paymentGPay || 0) + (order.paymentCash || 0) + (order.advanceUsed || 0);
                    
                    let orderType = '📦 Order';
                    if (order.isOffer) {
                      const offer = offers.find(o => o.id === order.offerId);
                      orderType = `📢 Offer: ${offer?.name || 'Unknown'}`;
                    } else if (order.isSpecial) orderType = '⭐ Special';
                    else if (order.isWalkin) orderType = '🚶 Walk-in';

                    return (
                      <tr key={order.id} className="border-b border-border-light hover:bg-border-light/50 transition-colors">
                        <td className="py-2 px-2">
                          <span className="font-bold text-primary text-xs">{order.orderNumber?.toString()}</span>
                        </td>
                        <td className="py-2 px-2 font-bold text-primary">#{index + 1}</td>
                        <td className="py-2 px-2">
                          <div className="font-medium">{order.customer || 'Guest'}</div>
                          <div className="text-[10px] text-text-light">{order.customerLocation}</div>
                        </td>
                        <td className="py-2 px-2">
                          <span className="text-xs">{orderType}</span>
                          {order.isOffer && order.offerQty && (
                            <div className="text-[10px] text-text-light">Qty: {order.offerQty}</div>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <div className="text-[10px] max-w-[120px] truncate">
                            {items.map(item => `${item.name} (${item.variant}) ×${item.quantity}`).join(', ')}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-medium ${isFullyPacked ? 'text-success' : 'text-warning'}`}>
                              {packedItems}/{totalItems}
                            </span>
                            <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${progress}%`, background: isFullyPacked ? '#1d6b44' : '#a86f2c' }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-[10px]">{formatDateTime(order.createdAt)}</td>
                        <td className="py-2 px-2 font-semibold">₹{order.total.toFixed(2)}</td>
                        <td className="py-2 px-2 text-success font-medium">₹{totalPaid.toFixed(2)}</td>
                        <td className="py-2 px-2">
                          <span className={pendingAmount > 0 ? 'text-danger font-bold' : 'text-success'}>
                            ₹{pendingAmount.toFixed(2)}
                            {pendingAmount <= 0 && ' ✅'}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: paymentColor, color: 'white' }}>
                              {paymentStatus}
                            </span>
                            {order.paymentConfirmed && (
                              <div className="text-[8px] text-success font-bold mt-0.5">✅ Confirmed</div>
                            )}
                            {!order.paymentConfirmed && pendingAmount === 0 && (
                              <div className="text-[8px] text-warning font-bold mt-0.5">⏳ Waiting for confirmation</div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`status-badge ${
                            order.status === 'completed' ? 'bg-success text-white' :
                            order.status === 'rejected' ? 'bg-danger text-white' :
                            'bg-warning text-white'
                          }`}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="p-1.5 rounded-full bg-[#d6e4f0] hover:bg-[#b8cde0] transition-colors"
                              title="View"
                            >
                              <i className="fas fa-eye text-info text-xs"></i>
                            </button>
                            
                            {/* Confirm Payment Button - Show when pending = 0 and not confirmed */}
                            {pendingAmount === 0 && !order.paymentConfirmed && (
                              <button
                                onClick={() => handleConfirmPayment(order.id)}
                                className="p-1.5 rounded-full bg-[#d4a017] hover:bg-[#d4a017]/80 transition-colors"
                                title="Confirm Payment"
                              >
                                <i className="fas fa-check-circle text-white text-xs"></i>
                              </button>
                            )}
                            
                            {/* Undo Payment Button - Show when payment is confirmed */}
                            {order.paymentConfirmed && (
                              <button
                                onClick={() => handleUndoPayment(order.id)}
                                className="p-1.5 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] transition-colors"
                                title="Undo Payment Confirmation"
                              >
                                <i className="fas fa-undo text-warning text-xs"></i>
                              </button>
                            )}
                            
                            {order.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => {
                                    const allOrders = storage.getOrders();
                                    const o = allOrders.find(ord => ord.id === order.id);
                                    if (o) {
                                      o.status = 'completed';
                                      storage.setOrders(allOrders);
                                      loadData();
                                      toast.success('Order Approved', `Order ${order.orderNumber?.toString()} approved!`);
                                    }
                                  }}
                                  className="p-1.5 rounded-full bg-[#e1f0e6] hover:bg-[#c8e0d0] transition-colors"
                                  title="Approve"
                                >
                                  <i className="fas fa-check text-success text-xs"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    const allOrders = storage.getOrders();
                                    const o = allOrders.find(ord => ord.id === order.id);
                                    if (o) {
                                      o.status = 'rejected';
                                      storage.setOrders(allOrders);
                                      loadData();
                                      toast.error('Order Rejected', `Order ${order.orderNumber?.toString()} rejected`);
                                    }
                                  }}
                                  className="p-1.5 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] transition-colors"
                                  title="Reject"
                                >
                                  <i className="fas fa-times text-danger text-xs"></i>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  const allOrders = storage.getOrders();
                                  const o = allOrders.find(ord => ord.id === order.id);
                                  if (o) {
                                    o.status = 'pending';
                                    storage.setOrders(allOrders);
                                    loadData();
                                    toast.success('Order Moved', `Order ${order.orderNumber?.toString()} moved to pending`);
                                  }
                                }}
                                className="p-1.5 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] transition-colors"
                                title="Move to Pending"
                              >
                                <i className="fas fa-undo text-warning text-xs"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ==================== SPECIAL ORDER MODAL ==================== */}
      <PopupModal
        isOpen={isSpecialOrderModalOpen}
        onClose={() => setIsSpecialOrderModalOpen(false)}
        title="Special Order"
        message=""
        type="info"
        showConfirm={false}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Customer Name *</label>
            <input
              type="text"
              value={specialCustomerName}
              onChange={(e) => setSpecialCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">BLK No / Door No</label>
            <input
              type="text"
              value={specialBlkNo}
              onChange={(e) => setSpecialBlkNo(e.target.value)}
              placeholder="e.g., 12A, Block 5"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Location</label>
            <input
              type="text"
              value={specialLocation}
              onChange={(e) => setSpecialLocation(e.target.value)}
              placeholder="e.g., KKNagar, Valasaravakkam"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Special Order Description *</label>
            <textarea
              value={specialDescription}
              onChange={(e) => setSpecialDescription(e.target.value)}
              rows={2}
              placeholder="Describe the special order details..."
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-y"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-text text-sm">
                <i className="fas fa-shopping-bag mr-1"></i> Products
              </label>
              <button onClick={handleAddSpecialProduct} className="btn btn-small bg-info text-white">
                <i className="fas fa-plus"></i> Add Product
              </button>
            </div>
            {specialProducts.map((item, index) => (
              <div key={index} className="flex flex-wrap gap-2 items-center p-2 bg-background rounded-lg border border-border mb-2">
                <select
                  value={item.productId}
                  onChange={(e) => handleSpecialProductChange(index, 'productId', Number(e.target.value))}
                  className="flex-1 min-w-[80px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                >
                  <option value="0">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={item.variantIndex}
                  onChange={(e) => {
                    const variantIdx = Number(e.target.value);
                    const product = products.find(p => p.id === item.productId);
                    const variant = product?.variants[variantIdx];
                    handleSpecialProductChange(index, 'variantIndex', variantIdx);
                    if (variant) handleSpecialProductChange(index, 'price', variant.price);
                  }}
                  className="w-[80px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                >
                  <option value="0">Variant</option>
                  {products.find(p => p.id === item.productId)?.variants.map((v: any, i: number) => (
                    <option key={i} value={i}>{v.weight}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => handleSpecialProductChange(index, 'qty', Number(e.target.value))}
                  className="w-[50px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => handleSpecialProductChange(index, 'price', Number(e.target.value))}
                  className="w-[70px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="Price"
                />
                <button
                  onClick={() => handleRemoveSpecialProduct(index)}
                  className="w-8 h-8 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] flex items-center justify-center text-danger transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between p-2 bg-background rounded-lg border border-border">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-primary">₹{specialTotal.toFixed(2)}</span>
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Delivery Date</label>
            <input
              type="date"
              value={specialDeliveryDate}
              onChange={(e) => setSpecialDeliveryDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Payment Method</label>
            <select
              value={specialPaymentMethod}
              onChange={(e) => setSpecialPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
              <option value="both">GPay + Cash</option>
              <option value="unpaid">Unpaid (Bill)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsSpecialOrderModalOpen(false)} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button onClick={handleSaveSpecialOrder} className="btn btn-primary flex-1">
              <i className="fas fa-save"></i> Save Order
            </button>
          </div>
        </div>
      </PopupModal>

      {/* ==================== WALK-IN MODAL ==================== */}
      <PopupModal
        isOpen={isWalkinModalOpen}
        onClose={() => setIsWalkinModalOpen(false)}
        title="Walk-in Customer Order"
        message=""
        type="info"
        showConfirm={false}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Customer Name *</label>
            <input
              type="text"
              value={walkinName}
              onChange={(e) => setWalkinName(e.target.value)}
              placeholder="Enter customer name"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">BLK No / Door No</label>
            <input
              type="text"
              value={walkinBlkNo}
              onChange={(e) => setWalkinBlkNo(e.target.value)}
              placeholder="e.g., 12A, Block 5"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Location</label>
            <input
              type="text"
              value={walkinLocation}
              onChange={(e) => setWalkinLocation(e.target.value)}
              placeholder="e.g., KKNagar, Valasaravakkam"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-text text-sm">
                <i className="fas fa-shopping-bag mr-1"></i> Products
              </label>
              <button onClick={handleAddWalkinProduct} className="btn btn-small bg-info text-white">
                <i className="fas fa-plus"></i> Add Product
              </button>
            </div>
            {walkinProducts.map((item, index) => (
              <div key={index} className="flex flex-wrap gap-2 items-center p-2 bg-background rounded-lg border border-border mb-2">
                <select
                  value={item.productId}
                  onChange={(e) => handleWalkinProductChange(index, 'productId', Number(e.target.value))}
                  className="flex-1 min-w-[80px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                >
                  <option value="0">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={item.variantIndex}
                  onChange={(e) => {
                    const variantIdx = Number(e.target.value);
                    const product = products.find(p => p.id === item.productId);
                    const variant = product?.variants[variantIdx];
                    handleWalkinProductChange(index, 'variantIndex', variantIdx);
                    if (variant) handleWalkinProductChange(index, 'price', variant.price);
                  }}
                  className="w-[80px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                >
                  <option value="0">Variant</option>
                  {products.find(p => p.id === item.productId)?.variants.map((v: any, i: number) => (
                    <option key={i} value={i}>{v.weight}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => handleWalkinProductChange(index, 'qty', Number(e.target.value))}
                  className="w-[50px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => handleWalkinProductChange(index, 'price', Number(e.target.value))}
                  className="w-[70px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="Price"
                />
                <button
                  onClick={() => handleRemoveWalkinProduct(index)}
                  className="w-8 h-8 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] flex items-center justify-center text-danger transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between p-2 bg-background rounded-lg border border-border">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-primary">₹{walkinTotal.toFixed(2)}</span>
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Payment Method</label>
            <select
              value={walkinPaymentMethod}
              onChange={(e) => setWalkinPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
              <option value="both">GPay + Cash</option>
              <option value="unpaid">Unpaid (Bill)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsWalkinModalOpen(false)} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button onClick={handleSaveWalkinOrder} className="btn btn-primary flex-1">
              <i className="fas fa-save"></i> Save Order
            </button>
          </div>
        </div>
      </PopupModal>

      {/* ==================== ADVANCE PAYMENT MODAL ==================== */}
      <PopupModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        title="Advance Payment"
        message=""
        type="info"
        showConfirm={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Select Customer *</label>
            <select
              value={advanceCustomer}
              onChange={(e) => setAdvanceCustomer(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Advance Amount (₹) *</label>
            <input
              type="number"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              placeholder="Enter amount"
              step="1"
              min="1"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Payment Method</label>
            <select
              value={advanceMethod}
              onChange={(e) => setAdvanceMethod(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Notes (Optional)</label>
            <input
              type="text"
              value={advanceNotes}
              onChange={(e) => setAdvanceNotes(e.target.value)}
              placeholder="e.g., Advance for monthly order"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsAdvanceModalOpen(false)} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button onClick={handleSaveAdvance} className="btn btn-primary flex-1">
              <i className="fas fa-save"></i> Save Payment
            </button>
          </div>
        </div>
      </PopupModal>

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
              <div><span className="font-semibold">Collection:</span> {COLLECTION_SHORT[selectedOrder.collectionMethod]}</div>
              <div><span className="font-semibold">Location:</span> {selectedOrder.location}</div>
              <div><span className="font-semibold">Status:</span> {selectedOrder.status}</div>
              <div><span className="font-semibold">Payment:</span> {getPaymentStatusLabel(selectedOrder)}</div>
              <div><span className="font-semibold">Payment Confirmed:</span> {selectedOrder.paymentConfirmed ? '✅ Yes' : '⏳ No'}</div>
              <div><span className="font-semibold">Total:</span> ₹{selectedOrder.total.toFixed(2)}</div>
            </div>

            {/* Date & Time */}
            <div className="border-t border-border pt-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold">Order Date:</span>
                  <span className="ml-2">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
                <div>
                  <span className="font-semibold">Order Time:</span>
                  <span className="ml-2">{new Date(selectedOrder.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}</span>
                </div>
              </div>
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
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-border/50 last:border-0 text-sm">
                    <span>{item.name} ({item.variant}) ×{item.quantity}</span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
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

      {/* Reminder Modal */}
      <PopupModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="Payment Reminders (30+ Days)"
        message=""
        type="warning"
        showConfirm={false}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-check-circle text-4xl text-success block mb-3"></i>
              <p className="text-text-light">No payment reminders (30+ days).</p>
            </div>
          ) : (
            reminders.map((r, idx) => (
              <div key={idx} className="bg-[#fef5f0] border border-[#d9534f] rounded-xl p-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <strong className="text-danger">{r.order.customer}</strong>
                    <span className="text-xs text-text-light ml-2">Order: {r.order.orderNumber}</span>
                    <span className="text-xs bg-[#f7e8d0] px-2 py-0.5 rounded-full ml-1">{getPaymentStatusLabel(r.order)}</span>
                  </div>
                  <span className="bg-[#d9534f] text-white px-2 py-0.5 rounded-full text-xs font-bold">
                    {r.days} days ago
                  </span>
                </div>
                <div className="text-xs text-text-light mt-1">
                  {r.order.items.map((i: any) => `${i.name} (${i.variant}) ×${i.quantity}`).join(', ')}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                  <span className="font-semibold">Pending: <span className="text-danger">₹{r.pendingAmount.toFixed(2)}</span></span>
                  <button
                    onClick={() => {
                      setIsReminderModalOpen(false);
                      handleViewOrder(r.order);
                    }}
                    className="btn btn-small bg-info text-white"
                  >
                    <i className="fas fa-eye"></i> View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopupModal>

      {/* Customer Bill Modal */}
      <PopupModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        title="Customer Statement"
        message=""
        type="info"
        showConfirm={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Select Customer *</label>
            <select
              value={billCustomer}
              onChange={(e) => setBillCustomer(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Start Date *</label>
            <input
              type="date"
              value={billStartDate}
              onChange={(e) => setBillStartDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">End Date *</label>
            <input
              type="date"
              value={billEndDate}
              onChange={(e) => setBillEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Show Orders</label>
            <select
              value={billOrderType}
              onChange={(e) => setBillOrderType(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="all">All Orders</option>
              <option value="paid">Paid Orders Only</option>
              <option value="unpaid">Unpaid Orders Only</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsBillModalOpen(false)} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button onClick={handleGenerateBill} className="btn btn-primary flex-1">
              <i className="fas fa-file-pdf"></i> Generate Statement
            </button>
          </div>
        </div>
      </PopupModal>

      <Footer isAdmin />
    </div>
  );
}