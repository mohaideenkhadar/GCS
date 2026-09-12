'use client';

import { Order } from '@/types';
import { formatDateTime } from '@/utils/helpers';

interface RushOrdersProps {
  orders: Order[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onPackToggle: (orderId: number, itemIndex: number) => void;
}

export const RushOrders = ({ orders, onApprove, onReject, onPackToggle }: RushOrdersProps) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-border">
        <i className="fas fa-check-circle text-5xl text-success block mb-3"></i>
        <p className="text-text-light text-lg">No pending orders!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {orders.map((order, index) => {
        const items = order.items || [];
        const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
        const packedItems = items.reduce((sum, i) => sum + (i.packed || 0), 0);
        const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
        const isFullyPacked = progress === 100 && totalItems > 0;
        const totalAmount = order.total || 0;
        const paidAmount = (order.paymentGPay || 0) + (order.paymentCash || 0);
        const remaining = totalAmount - paidAmount;

        return (
          <div key={order.id} className="bg-white rounded-2xl p-4 border border-border shadow-card hover:shadow-card-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-border-light">
              <span className="font-bold text-primary text-lg">#{index + 1}</span>
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
                      <button
                        onClick={() => onPackToggle(order.id, idx)}
                        className="w-5 h-5 rounded bg-white border border-border flex items-center justify-center text-xs hover:bg-border-light transition-colors duration-200"
                      >
                        {packed >= quantity ? '✅' : '⬜'}
                      </button>
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

            <div className="mt-3 pt-2 border-t border-border-light">
              <div className="flex justify-between text-sm">
                <span>Total: <strong className="text-text">₹{totalAmount.toFixed(2)}</strong></span>
                <span>Paid: <span className="text-success font-medium">₹{paidAmount.toFixed(2)}</span></span>
                <span>Remaining: <span className={remaining > 0 ? 'text-danger font-medium' : 'text-success font-medium'}>
                  ₹{remaining.toFixed(2)}
                </span></span>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onApprove(order.id)}
                className="flex-1 py-1.5 rounded-lg bg-success text-white text-sm font-semibold hover:bg-success/80 transition-colors duration-200"
              >
                <i className="fas fa-check mr-1"></i> Approve
              </button>
              <button
                onClick={() => onReject(order.id)}
                className="flex-1 py-1.5 rounded-lg bg-danger text-white text-sm font-semibold hover:bg-danger/80 transition-colors duration-200"
              >
                <i className="fas fa-times mr-1"></i> Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};