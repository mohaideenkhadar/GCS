'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { DeliveryCharge } from '@/types';
import { getCustomerAdvanceBalance, generateUniqueOrderId } from '@/utils/helpers';
import { storage } from '@/utils/storage';
import { useToast } from '@/hooks/useToast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryCharges: DeliveryCharge[];
}

export const CheckoutModal = ({ isOpen, onClose, deliveryCharges }: CheckoutModalProps) => {
  const toast = useToast();
  const { cart, clearCart, getTotalPrice } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'pickup' | 'delivery' | 'store'>('pickup');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gpay' | 'both' | 'advance' | 'unpaid'>('cash');
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [advanceBalance, setAdvanceBalance] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState(''); // New state for feedback

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCustomerName('');
      setCustomerLocation('');
      setCollectionMethod('pickup');
      setSelectedDeliveryId(null);
      setPaymentMethod('cash');
      setIsLocationVerified(false);
      setAdvanceBalance(0);
      setFeedback(''); // Reset feedback
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (customerName.trim()) {
      const balance = getCustomerAdvanceBalance(customerName.trim());
      setAdvanceBalance(balance);
    } else {
      setAdvanceBalance(0);
    }
  }, [customerName]);

  useEffect(() => {
    if (collectionMethod === 'delivery' && selectedDeliveryId && customerLocation.trim()) {
      const delivery = deliveryCharges.find(d => d.id === selectedDeliveryId);
      if (delivery) {
        const isMatch = customerLocation.trim().toLowerCase() === delivery.location.toLowerCase() ||
          customerLocation.trim().toLowerCase().includes(delivery.location.toLowerCase()) ||
          delivery.location.toLowerCase().includes(customerLocation.trim().toLowerCase());
        setIsLocationVerified(isMatch);
      }
    }
  }, [selectedDeliveryId, customerLocation, collectionMethod, deliveryCharges]);

  if (!mounted || !isOpen) return null;

  const subtotal = getTotalPrice();
  const deliveryCharge = collectionMethod === 'delivery' && selectedDeliveryId
    ? deliveryCharges.find(d => d.id === selectedDeliveryId)?.charge || 0
    : 0;
  const total = subtotal + deliveryCharge;
  const advanceUsed = Math.min(advanceBalance, total);
  const amountToPay = total - advanceUsed;

  const handlePlaceOrder = () => {
    if (!customerName.trim()) {
      toast.error('Missing Information', 'Please enter your name or address.');
      return;
    }
    if (!customerLocation.trim()) {
      toast.error('Missing Information', 'Please enter your location.');
      return;
    }
    if (collectionMethod === 'delivery') {
      if (!selectedDeliveryId) {
        toast.error('Missing Information', 'Please select a delivery location.');
        return;
      }
      if (!isLocationVerified) {
        toast.error('Location Error', 'Location not verified! Please ensure your location matches the selected delivery area.');
        return;
      }
    }

    let paymentGPay = 0;
    let paymentCash = 0;

    if (paymentMethod === 'cash') paymentCash = amountToPay;
    else if (paymentMethod === 'gpay') paymentGPay = amountToPay;
    else if (paymentMethod === 'both') {
      paymentGPay = amountToPay / 2;
      paymentCash = amountToPay / 2;
    } else if (paymentMethod === 'advance') {
      if (amountToPay > 0) {
        toast.error('Payment Error', 'Advance balance is not enough to cover the full amount!');
        return;
      }
    }

    if (advanceUsed > 0) {
      const advances = storage.getAdvances();
      let remainingAdvance = advanceUsed;
      const newAdvances = [];
      for (const a of advances) {
        if (a.customer === customerName.trim() && remainingAdvance > 0) {
          if (a.amount <= remainingAdvance) {
            remainingAdvance -= a.amount;
          } else {
            a.amount -= remainingAdvance;
            remainingAdvance = 0;
            newAdvances.push(a);
          }
        } else {
          newAdvances.push(a);
        }
      }
      storage.setAdvances(newAdvances);
    }

    const orderItems = cart.map(item => ({
      productId: item.productId,
      name: item.name,
      variant: item.weight,
      quantity: item.quantity,
      price: item.price,
    }));

    const orders = storage.getOrders();

    const order = {
      id: Date.now() + 1000 + Math.floor(Math.random() * 1000),
      orderNumber: generateUniqueOrderId(),
      customer: customerName.trim(),
      customerLocation: customerLocation.trim(),
      location: collectionMethod === 'delivery'
        ? deliveryCharges.find(d => d.id === selectedDeliveryId)?.location || 'Delivery'
        : collectionMethod === 'pickup' ? 'Store Pickup' : 'Store Purchase',
      collectionMethod,
      deliveryCharge,
      subtotal,
      total,
      items: orderItems,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      paymentGPay,
      paymentCash,
      advanceUsed,
      paymentMethod,
      paymentConfirmed: false,
      feedback: feedback.trim() || '', // Add feedback to order
    };

    const products = storage.getProducts();
    cart.forEach(cartItem => {
      const product = products.find(p => p.id === cartItem.productId);
      if (product && product.variants && product.variants[cartItem.variantIndex]) {
        product.variants[cartItem.variantIndex].stock -= cartItem.quantity;
      }
    });
    storage.setProducts(products);

    orders.unshift(order);
    storage.setOrders(orders);
    clearCart();
    onClose();

    const methodLabels = {
      pickup: '📦 Pickup from Store',
      delivery: '🚚 Delivery to Address',
      store: '🏪 Store Purchase',
    };

    let msg = `✅ Order placed successfully!\nOrder ID: ${order.orderNumber}\n\nTotal: ₹${total.toFixed(2)}`;
    if (advanceUsed > 0) msg += `\nAdvance Used: ₹${advanceUsed.toFixed(2)}`;
    if (amountToPay > 0) msg += `\nPaid: ₹${amountToPay.toFixed(2)}`;
    else msg += `\n✅ Fully paid using advance!`;
    msg += `\nCollection: ${methodLabels[collectionMethod]}`;
    msg += `\nPayment Method: ${paymentMethod.toUpperCase()}`;
    if (feedback.trim()) msg += `\n\nFeedback: ${feedback.trim()}`;
    msg += `\n\nPayment will be confirmed by admin after verification.`;
    msg += `\n\nThank you for shopping at Gayathri Homely Delights!`;

    toast.success('Order Placed!', msg);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl max-w-[550px] w-[95%] max-h-[95vh] overflow-y-auto shadow-card-lg">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-border">
          <h3 className="flex items-center gap-2 text-sm sm:text-base font-medium text-text">
            <i className="fas fa-address-card text-secondary"></i>
            Delivery Details
          </h3>
          <button onClick={onClose} className="text-2xl font-light text-text-light hover:text-danger transition-transform hover:rotate-90">
            &times;
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="form-group mb-4">
            <label className="block font-semibold text-text mb-1 text-sm">Name / BLK No / Door No *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g., Rajesh Kumar, 12A"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="form-group mb-4">
            <label className="block font-semibold text-text mb-1 text-sm">Your Location *</label>
            <input
              type="text"
              value={customerLocation}
              onChange={(e) => setCustomerLocation(e.target.value)}
              placeholder="e.g., KKNagar, Valasaravakkam"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>

          {advanceBalance > 0 && (
            <div className="bg-success/10 p-3 rounded-xl border-2 border-success mb-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <i className="fas fa-coins text-success"></i>
                  <strong className="text-success ml-1">Advance Balance:</strong>
                  <span className="font-bold text-success ml-1">₹{advanceBalance.toFixed(2)}</span>
                </div>
                {advanceUsed > 0 && (
                  <div>
                    <span className="text-sm text-success">Will be used: <strong className="text-danger">₹{advanceUsed.toFixed(2)}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-group mb-4">
            <label className="block font-semibold text-text mb-1 text-sm">How would you like to receive your order? *</label>
            <select
              value={collectionMethod}
              onChange={(e) => setCollectionMethod(e.target.value as 'pickup' | 'delivery' | 'store')}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="pickup">📦 Pickup (Collect from store later)</option>
              <option value="delivery">🚚 Delivery to my address</option>
              <option value="store">🏪 I'll buy at the store</option>
            </select>
          </div>

          {collectionMethod === 'delivery' && (
            <div className="mb-4">
              <div className="form-group">
                <label className="block font-semibold text-text mb-1 text-sm">Select Delivery Location *</label>
                <select
                  value={selectedDeliveryId || ''}
                  onChange={(e) => setSelectedDeliveryId(Number(e.target.value) || null)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
                >
                  <option value="">Select location</option>
                  {deliveryCharges.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.location} (₹{d.charge.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDeliveryId && customerLocation.trim() && (
                <div className={`mt-3 p-3 rounded-xl border-2 flex items-center gap-3 ${
                  isLocationVerified
                    ? 'border-success bg-success/10 text-success'
                    : 'border-danger bg-danger/10 text-danger'
                }`}>
                  <i className={`fas ${isLocationVerified ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                  <span className="font-medium text-sm">
                    {isLocationVerified
                      ? `✅ Location verified! Delivery to "${deliveryCharges.find(d => d.id === selectedDeliveryId)?.location}"`
                      : `❌ Location mismatch! Entered "${customerLocation}" but selected "${deliveryCharges.find(d => d.id === selectedDeliveryId)?.location}"`}
                  </span>
                </div>
              )}

              {isLocationVerified && (
                <div className="mt-3 bg-background p-3 rounded-xl border border-border flex justify-between">
                  <span className="font-semibold">Delivery Charge:</span>
                  <span className="font-semibold text-danger">
                    ₹{deliveryCharges.find(d => d.id === selectedDeliveryId)?.charge.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}
            </div>
          )}

          {collectionMethod === 'pickup' && (
            <div className="p-3 bg-success/10 rounded-xl border border-success mb-4">
              <p className="text-sm">
                <i className="fas fa-info-circle text-success"></i>
                <strong className="ml-1">Pickup Information:</strong>
                Your order will be ready for pickup at our store. You can collect it anytime during working hours.
              </p>
            </div>
          )}

          {collectionMethod === 'store' && (
            <div className="p-3 bg-[#f0e6dc] rounded-xl border border-danger mb-4">
              <p className="text-sm">
                <i className="fas fa-info-circle text-danger"></i>
                <strong className="ml-1">Store Purchase:</strong>
                You can buy these items directly at our store. Your order will be ready for you to pick up and pay at the counter.
              </p>
            </div>
          )}

          <div className="form-group mb-4">
            <label className="block font-semibold text-text mb-1 text-sm">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'gpay' | 'both' | 'advance' | 'unpaid')}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
              <option value="both">GPay + Cash</option>
              <option value="advance">Use Advance Only</option>
              <option value="unpaid">Unpaid (Bill)</option>
            </select>
          </div>

          <div className="bg-background p-3 rounded-xl border border-border mb-4">
            <p className="text-xs sm:text-sm text-text-light">
              <i className="fas fa-info-circle"></i>
              {' '}
              {paymentMethod === 'cash' && `You will pay ₹${amountToPay.toFixed(2)} in Cash when you collect your order.`}
              {paymentMethod === 'gpay' && `You will pay ₹${amountToPay.toFixed(2)} via GPay.`}
              {paymentMethod === 'both' && `You will pay ₹${(amountToPay/2).toFixed(2)} in Cash and ₹${(amountToPay/2).toFixed(2)} via GPay.`}
              {paymentMethod === 'advance' && `₹${amountToPay.toFixed(2)} will be deducted from your advance balance.`}
              {paymentMethod === 'unpaid' && `You will pay ₹${amountToPay.toFixed(2)} later (Bill).`}
            </p>
            <p className={`text-xs mt-1 ${
              paymentMethod === 'unpaid' ? 'text-danger' :
              paymentMethod === 'advance' ? 'text-success' : 'text-warning'
            }`}>
              <i className={`fas ${
                paymentMethod === 'unpaid' ? 'fa-info-circle' :
                paymentMethod === 'advance' ? 'fa-check-circle' : 'fa-clock'
              }`}></i>
              {' '}
              {paymentMethod === 'unpaid'
                ? 'You will receive a bill. Payment can be made later.'
                : paymentMethod === 'advance'
                ? 'Amount will be deducted from your advance balance.'
                : 'Payment will be confirmed by admin after verification.'}
            </p>
          </div>

          {/* ====== FEEDBACK / SUGGESTIONS SECTION ====== */}
          <div className="form-group mb-4">
            <label className="block font-semibold text-text mb-1 text-sm">
              <i className="fas fa-comment text-primary-light mr-1"></i>
              Feedback / Suggestions
              <span className="text-xs font-normal text-text-light ml-1">(Optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any feedback or suggestions for us? We'd love to hear from you!"
              rows={3}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-y"
            />
            <p className="text-[10px] text-text-light mt-1">
              <i className="fas fa-info-circle mr-1"></i>
              Your feedback helps us improve our service
            </p>
          </div>

          <div className="bg-background p-3 rounded-xl border border-border">
            <div className="flex justify-between font-semibold">
              <span>Order Summary</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery:</span>
              <span>₹{deliveryCharge.toFixed(2)}</span>
            </div>
            {advanceUsed > 0 && (
              <div className="flex justify-between text-success">
                <span>Advance Used:</span>
                <span>₹{advanceUsed.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-border pt-2 mt-2 font-bold text-base sm:text-lg">
              <span>Amount to Pay:</span>
              <span className="text-danger">₹{amountToPay.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white z-10 px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-border flex justify-end gap-3 flex-wrap">
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button onClick={handlePlaceOrder} className="btn btn-primary">
            <i className="fas fa-check"></i> Place Order
          </button>
        </div>
      </div>
    </div>
  );
};