'use client';

import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

interface CartSlideProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartSlide = ({ isOpen, onClose, onCheckout }: CartSlideProps) => {
  const { cart, removeFromCart, removeItemCompletely, getTotalPrice, updateQuantity } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1500]">
      <div 
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        onClick={onClose}
      ></div>
      <div className="absolute top-0 right-0 w-full max-w-[440px] h-full bg-white shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-0">
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b-2 border-border">
          <h2 className="text-lg sm:text-xl font-medium text-text">
            <i className="fas fa-shopping-bag text-primary-light mr-2"></i>
            Your Cart
          </h2>
          <button onClick={onClose} className="text-2xl font-light text-text-light hover:text-danger transition-transform hover:rotate-90">
            &times;
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 overflow-y-auto h-[calc(100vh-200px)]">
          {cart.length === 0 ? (
            <div className="text-center py-10">
              <i className="fas fa-shopping-cart text-5xl text-border block mb-4"></i>
              <p className="text-text-muted">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantIndex}`}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text">{item.name}</h4>
                      <span className="text-xs text-text-light">{item.weight} - ₹{item.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(item.productId, item.variantIndex)}
                      className="w-6 h-6 rounded-full bg-border-light flex items-center justify-center text-xs hover:bg-border transition-colors"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <span className="font-semibold min-w-[20px] text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantIndex, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-border-light flex items-center justify-center text-xs hover:bg-border transition-colors"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                    <button
                      onClick={() => removeItemCompletely(item.productId, item.variantIndex)}
                      className="text-danger text-sm hover:text-[#d9534f] transition-colors ml-1"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>

                  <div className="text-sm font-semibold text-text text-right min-w-[60px]">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 py-4 border-t-2 border-border bg-white">
            <div className="text-lg font-semibold text-text mb-3">
              Total: <span className="text-primary ml-1">₹{getTotalPrice().toFixed(2)}</span>
            </div>
            <button 
              onClick={onCheckout} 
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-hover transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};