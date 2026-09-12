'use client';

import { useState, useEffect, useRef } from 'react';
import { DeliveryCharge, Product } from '@/types';
import { storage } from '@/utils/storage';
import { getCustomerAdvanceBalance, generateUniqueOrderId } from '@/utils/helpers';
import { useToast } from '@/hooks/useToast';

interface OfferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string | null;
  deliveryCharges: DeliveryCharge[];
}

export const OfferOrderModal = ({ isOpen, onClose, offerId, deliveryCharges }: OfferOrderModalProps) => {
  const toast = useToast();
  const [offer, setOffer] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'pickup' | 'delivery' | 'store'>('pickup');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gpay' | 'both' | 'advance' | 'unpaid'>('cash');
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [advanceBalance, setAdvanceBalance] = useState(0);
  const [extraProducts, setExtraProducts] = useState<Array<{ productId: number; variantIndex: number; qty: number; price: number }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const initialLoadDone = useRef(false);
  const isFirstRender = useRef(true);

  // Mount effect
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load offer data when modal opens - FIXED: Removed toast and onClose from dependencies
  useEffect(() => {
    // Skip first render to avoid unnecessary updates
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isOpen && offerId) {
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
      
      try {
        const offers = storage.getOffers();
        const found = offers.find(o => o.id == offerId);
        
        if (found) {
          setOffer(found);
          // Load products
          setProducts(storage.getProducts());
        } else {
          // Use toast.error but don't include it in dependencies
          toast.error('Offer Not Found', 'The offer you selected is no longer available.');
          onClose();
          return;
        }
      } catch (error) {
        console.error('Error loading offer:', error);
        toast.error('Error', 'Failed to load offer details.');
        onClose();
      } finally {
        setIsLoading(false);
      }
      
      // Reset form fields only when modal opens with a new offer
      if (offerId) {
        setQty(1);
        setCustomerName('');
        setCustomerLocation('');
        setCollectionMethod('pickup');
        setSelectedDeliveryId(null);
        setPaymentMethod('cash');
        setIsLocationVerified(false);
        setAdvanceBalance(0);
        setExtraProducts([]);
        setFeedback('');
        initialLoadDone.current = true;
      }
    } else {
      document.body.style.overflow = '';
      initialLoadDone.current = false;
    }
    return () => {
      document.body.style.overflow = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, offerId]); // Only depend on isOpen and offerId

  // Update advance balance when customer name changes - FIXED: dependency array
  useEffect(() => {
    if (customerName.trim()) {
      const balance = getCustomerAdvanceBalance(customerName.trim());
      setAdvanceBalance(balance);
    } else {
      setAdvanceBalance(0);
    }
  }, [customerName]);

  // Verify location when delivery method changes - FIXED: dependency array
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

  // If not mounted or not open or no offer, return null
  if (!mounted || !isOpen || !offer) return null;

  // If loading, show loader
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-card-lg">
          <i className="fas fa-spinner fa-spin text-3xl text-primary block mb-3"></i>
          <p className="text-text-light">Loading offer details...</p>
        </div>
      </div>
    );
  }

  const offerAmount = offer.amount * qty;
  const extraTotal = extraProducts.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryCharge = collectionMethod === 'delivery' && selectedDeliveryId
    ? deliveryCharges.find(d => d.id === selectedDeliveryId)?.charge || 0
    : 0;
  const total = offerAmount + extraTotal + deliveryCharge;
  const advanceUsed = Math.min(advanceBalance, total);
  const amountToPay = total - advanceUsed;

  const handleAddExtraProduct = () => {
    setExtraProducts([...extraProducts, { productId: 0, variantIndex: 0, qty: 1, price: 0 }]);
  };

  const handleRemoveExtraProduct = (index: number) => {
    setExtraProducts(extraProducts.filter((_, i) => i !== index));
  };

  const handleExtraProductChange = (index: number, field: string, value: any) => {
    const updated = [...extraProducts];
    updated[index] = { ...updated[index], [field]: value };
    setExtraProducts(updated);
  };

  const handlePlaceOrder = () => {
    if (!customerName.trim()) {
      toast.error('Missing Information', 'Please enter your name.');
      const nameInput = document.getElementById('offerCustomerName');
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (!customerLocation.trim()) {
      toast.error('Missing Information', 'Please enter your location.');
      const locationInput = document.getElementById('offerCustomerLocation');
      if (locationInput) {
        locationInput.focus();
        locationInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (collectionMethod === 'delivery') {
      if (!selectedDeliveryId) {
        toast.error('Missing Information', 'Please select a delivery location.');
        const deliverySelect = document.getElementById('offerDeliveryLocationSelect');
        if (deliverySelect) {
          deliverySelect.focus();
          deliverySelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (!isLocationVerified) {
        toast.error('Location Error', 'Location not verified!');
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

    const orderItems = extraProducts.map(item => {
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
      subtotal: offerAmount + extraTotal,
      total,
      items: orderItems,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      paymentGPay,
      paymentCash,
      advanceUsed,
      isOffer: true,
      offerId: offer.id,
      offerQty: qty,
      paymentMethod,
      paymentConfirmed: false,
      specialDescription: `Offer: ${offer.name} x${qty}`,
      feedback: feedback.trim() || '',
    };

    orders.unshift(order);
    storage.setOrders(orders);

    const offers = storage.getOffers();
    const offerIndex = offers.findIndex(o => o.id == offer.id);
    if (offerIndex !== -1) {
      offers[offerIndex].bookedCount = (offers[offerIndex].bookedCount || 0) + 1;
      storage.setOffers(offers);
    }

    onClose();

    const methodLabels = {
      pickup: '📦 Pickup from Store',
      delivery: '🚚 Delivery to Address',
      store: '🏪 Store Purchase',
    };

    let msg = `✅ Offer booked successfully!\nOrder ID: ${order.orderNumber}\nOffer: ${offer.name}\nQuantity: ${qty}\nOffer Amount: ₹${offerAmount.toFixed(2)}`;
    if (extraTotal > 0) msg += `\nExtra Products: ₹${extraTotal.toFixed(2)}`;
    if (deliveryCharge > 0) msg += `\nDelivery: ₹${deliveryCharge.toFixed(2)}`;
    msg += `\nTotal: ₹${total.toFixed(2)}`;
    msg += `\nCollection: ${methodLabels[collectionMethod]}`;
    msg += `\nPayment Method: ${paymentMethod.toUpperCase()}`;
    if (advanceUsed > 0) msg += `\nAdvance Used: ₹${advanceUsed.toFixed(2)}`;
    if (amountToPay > 0) msg += `\nPaid: ₹${amountToPay.toFixed(2)}`;
    else msg += `\n✅ Fully paid using advance!`;
    if (feedback.trim()) msg += `\n\nFeedback: ${feedback.trim()}`;
    msg += `\n\nPayment will be confirmed by admin after verification.`;

    toast.success('Offer Booked!', msg);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl max-w-[700px] w-[95%] max-h-[90vh] overflow-y-auto shadow-card-lg">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-border">
          <h3 className="flex items-center gap-2 text-sm sm:text-base font-medium text-text">
            <i className="fas fa-bullhorn text-[#d4a017]"></i>
            {offer.name}
          </h3>
          <button onClick={onClose} className="text-2xl font-light text-text-light hover:text-danger transition-transform hover:rotate-90">
            &times;
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5">
          {/* Offer Details */}
          <div className="bg-[#f0e6b0] p-3 sm:p-4 rounded-xl border-2 border-[#d4a017] mb-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="text-xs sm:text-sm text-text-light">Offer Price (per unit)</span>
                <p className="text-xl sm:text-2xl font-bold text-[#d4a017]">₹{offer.amount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm text-text-light">Deadline</span>
                <p className="text-sm sm:text-base font-semibold text-danger">
                  {new Date(offer.deadline).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {offer.description && (
              <p className="text-sm text-text-light mt-2 border-t border-[#d4a017]/30 pt-2">
                {offer.description}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="bg-background p-3 sm:p-4 rounded-xl border border-border mb-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="font-semibold text-sm sm:text-base">
                  <i className="fas fa-shopping-bag mr-1"></i> Quantity
                </span>
                <span className="text-xs sm:text-sm text-text-light block">How many units do you want?</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] flex items-center justify-center text-danger transition-colors"
                >
                  <i className="fas fa-minus"></i>
                </button>
                <span className="text-xl font-bold min-w-[30px] text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] flex items-center justify-center text-danger transition-colors"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-border">
              <span className="text-sm text-text-light">Price per unit</span>
              <span className="font-semibold text-[#d4a017]">₹{offer.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-semibold">Subtotal</span>
              <span className="font-bold text-danger">₹{offerAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="form-group mb-4">
            <label className="block font-semibold text-text mb-1 text-sm">Name / BLK No / Door No *</label>
            <input
              id="offerCustomerName"
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
              id="offerCustomerLocation"
              type="text"
              value={customerLocation}
              onChange={(e) => setCustomerLocation(e.target.value)}
              placeholder="e.g., KKNagar, Valasaravakkam"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>

          {advanceBalance > 0 && (
            <div className="bg-success/10 p-3 rounded-xl border-2 border-success mb-4">
              <p className="text-sm">
                <i className="fas fa-info-circle text-success"></i>
                <strong className="ml-1 text-success">Advance Balance:</strong>
                <span className="font-bold text-success ml-1">₹{advanceBalance.toFixed(2)}</span>
                {advanceUsed > 0 && (
                  <span className="ml-2">| <strong>Will be used:</strong> <span className="text-danger">₹{advanceUsed.toFixed(2)}</span></span>
                )}
              </p>
            </div>
          )}

          {/* Collection Method */}
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

          {/* Delivery Section */}
          {collectionMethod === 'delivery' && (
            <div className="mb-4">
              <div className="form-group">
                <label className="block font-semibold text-text mb-1 text-sm">Select Delivery Location *</label>
                <select
                  id="offerDeliveryLocationSelect"
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

          {/* Pickup Info */}
          {collectionMethod === 'pickup' && (
            <div className="p-3 bg-success/10 rounded-xl border border-success mb-4">
              <p className="text-sm">
                <i className="fas fa-info-circle text-success"></i>
                <strong className="ml-1">Pickup Information:</strong>
                Your order will be ready for pickup at our store.
              </p>
            </div>
          )}

          {/* Store Info */}
          {collectionMethod === 'store' && (
            <div className="p-3 bg-[#f0e6dc] rounded-xl border border-danger mb-4">
              <p className="text-sm">
                <i className="fas fa-info-circle text-danger"></i>
                <strong className="ml-1">Store Purchase:</strong>
                You can buy these items directly at our store.
              </p>
            </div>
          )}

          {/* Extra Products */}
          <div className="mt-4 pt-3 border-t-2 border-border">
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-sm text-text">
                <i className="fas fa-plus-circle mr-1"></i> Extra Products (Optional)
              </label>
              <button onClick={handleAddExtraProduct} className="btn btn-small bg-info text-white">
                <i className="fas fa-plus"></i> Add
              </button>
            </div>
            <p className="text-xs text-text-light mb-2">Add extra products along with the offer</p>

            {extraProducts.map((item, index) => (
              <div key={index} className="flex flex-wrap gap-2 items-center p-2 bg-background rounded-lg border border-border mb-2">
                <div className="flex-1 min-w-[100px]">
                  <select
                    value={item.productId}
                    onChange={(e) => handleExtraProductChange(index, 'productId', Number(e.target.value))}
                    className="w-full p-1.5 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    <option value="0">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[80px]">
                  <select
                    value={item.variantIndex}
                    onChange={(e) => {
                      const variantIdx = Number(e.target.value);
                      const product = products.find(p => p.id === item.productId);
                      const variant = product?.variants[variantIdx];
                      handleExtraProductChange(index, 'variantIndex', variantIdx);
                      if (variant) handleExtraProductChange(index, 'price', variant.price);
                    }}
                    className="w-full p-1.5 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    <option value="0">Select Variant</option>
                    {products.find(p => p.id === item.productId)?.variants.map((v, i) => (
                      <option key={i} value={i}>{v.weight} - ₹{v.price.toFixed(2)}</option>
                    ))}
                  </select>
                </div>
                <div className="w-[50px]">
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => handleExtraProductChange(index, 'qty', Number(e.target.value))}
                    className="w-full p-1.5 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
                <div className="w-[60px]">
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleExtraProductChange(index, 'price', Number(e.target.value))}
                    className="w-full p-1.5 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="Price"
                  />
                </div>
                <button
                  onClick={() => handleRemoveExtraProduct(index)}
                  className="w-7 h-7 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] flex items-center justify-center text-danger transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Payment Method */}
          <div className="form-group mt-4">
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

          {/* Payment Instruction */}
          <div className="mt-3 bg-background p-3 rounded-xl border border-border">
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

          {/* Feedback Section */}
          <div className="form-group mt-4">
            <label className="block font-semibold text-text mb-1 text-sm">
              <i className="fas fa-comment text-primary-light mr-1"></i>
              Feedback / Suggestions
              <span className="text-xs font-normal text-text-light ml-1">(Optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any feedback or suggestions about this offer?"
              rows={2}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-y"
            />
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 p-3 bg-background rounded-xl border-2 border-border mt-4">
            <div>
              <span className="text-[10px] sm:text-xs text-text-light">Offer</span>
              <div className="font-bold text-[#d4a017] text-sm sm:text-base">₹{offerAmount.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-text-light">Extra</span>
              <div className="font-bold text-info text-sm sm:text-base">₹{extraTotal.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-text-light">Delivery</span>
              <div className="font-bold text-warning text-sm sm:text-base">₹{deliveryCharge.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-text-light">Total</span>
              <div className="font-bold text-danger text-base sm:text-lg">₹{total.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white z-10 px-4 sm:px-6 py-3 sm:py-4 border-t-2 border-border flex justify-end gap-3 flex-wrap">
          <button onClick={onClose} className="btn btn-outline">Cancel</button>
          <button onClick={handlePlaceOrder} className="btn bg-[#d4a017] text-white hover:bg-[#d4a017]/80">
            <i className="fas fa-check"></i> Book Offer
          </button>
        </div>
      </div>
    </div>
  );
};