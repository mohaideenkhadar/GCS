'use client';

import { useState } from 'react';
import { Order } from '@/types';
import {
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getUnpaidAmount,
  COLLECTION_SHORT,
  COLLECTION_COLORS,
  formatDateTime,
} from '@/utils/helpers';
import { storage } from '@/utils/storage';
import { useToast } from '@/hooks/useToast';
import { PopupModal } from '@/components/common/PopupModal';

interface OrdersTableProps {
  orders: Order[];
  onUpdate: () => void;
}

export const OrdersTable = ({ orders, onUpdate }: OrdersTableProps) => {
  const toast = useToast();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    orderId: number | null;
    action: 'approve' | 'reject' | null;
  }>({
    isOpen: false,
    orderId: null,
    action: null,
  });

  const handleStatusChange = (orderId: number, action: 'approve' | 'reject') => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    if (action === 'approve') {
      const pendingAmount = getUnpaidAmount(order);
      if (pendingAmount > 0) {
        toast.error(`Payment not fully received!\nPending: ₹${pendingAmount.toFixed(2)}`);
        return;
      }
      order.status = 'completed';
    } else {
      order.status = 'rejected';
    }

    storage.setOrders(allOrders);
    onUpdate();
    toast.success(`Order ${action === 'approve' ? 'approved' : 'rejected'}!`);
    setConfirmModal({ isOpen: false, orderId: null, action: null });
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-border">
        <i className="fas fa-box-open text-4xl sm:text-5xl text-border block mb-3"></i>
        <p className="text-text-light">No orders found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">#</th>
                <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Customer</th>
                <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Collection</th>
                <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Items</th>
                <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Date</th>
                <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Total</th>
                <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Payment</th>
                <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Status</th>
                <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const items = order.items || [];
                const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
                const packedItems = items.reduce((sum, i) => sum + (i.packed || 0), 0);
                const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
                const isFullyPacked = progress === 100 && totalItems > 0;
                const paymentStatus = getPaymentStatusLabel(order);
                const paymentColor = getPaymentStatusColor(order);
                const pendingAmount = getUnpaidAmount(order);
                const collectionLabel = COLLECTION_SHORT[order.collectionMethod] || 'Pickup';
                const collectionColor = COLLECTION_COLORS[order.collectionMethod] || '#e1f0e6';

                return (
                  <tr key={order.id} className="border-b border-border-light hover:bg-border-light transition-colors">
                    <td className="py-2 px-2 font-bold text-primary">#{index + 1}</td>
                    <td className="py-2 px-2">
                      <div className="font-medium">{order.customer || 'Guest'}</div>
                      <div className="text-[10px] text-text-light">{order.customerLocation}</div>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap"
                        style={{ background: collectionColor }}
                      >
                        {collectionLabel}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="text-[10px] sm:text-xs max-w-[150px] truncate">
                        {items.map(item => `${item.name} (${item.variant}) ×${item.quantity}`).join(', ')}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium ${isFullyPacked ? 'text-success' : 'text-warning'}`}>
                          {packedItems}/{totalItems} packed
                        </span>
                        <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%`, background: isFullyPacked ? '#1d6b44' : '#a86f2c' }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-[10px] sm:text-xs">{formatDateTime(order.createdAt)}</td>
                    <td className="py-2 px-2 font-semibold">₹{order.total.toFixed(2)}</td>
                    <td className="py-2 px-2">
                      <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: paymentColor, color: 'white' }}>
                        {paymentStatus}
                      </span>
                      {pendingAmount > 0 && (
                        <div className="text-[10px] text-danger font-medium mt-0.5">
                          Pending: ₹{pendingAmount.toFixed(2)}
                        </div>
                      )}
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
                        {order.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => setConfirmModal({ isOpen: true, orderId: order.id, action: 'approve' })}
                              className="btn-icon bg-[#e1f0e6] hover:bg-[#c8e0d0]"
                              title="Approve"
                            >
                              <i className="fas fa-check text-success"></i>
                            </button>
                            <button
                              onClick={() => setConfirmModal({ isOpen: true, orderId: order.id, action: 'reject' })}
                              className="btn-icon bg-[#f7e8d0] hover:bg-[#f0dcc0]"
                              title="Reject"
                            >
                              <i className="fas fa-times text-danger"></i>
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
                                onUpdate();
                                toast.success('Order moved to pending');
                              }
                            }}
                            className="btn-icon bg-[#f7e8d0] hover:bg-[#f0dcc0]"
                            title="Move to Pending"
                          >
                            <i className="fas fa-undo text-warning"></i>
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
      </div>

      <PopupModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, orderId: null, action: null })}
        title={confirmModal.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
        message={confirmModal.action === 'approve' 
          ? 'Approve this order? This will mark it as completed.'
          : 'Reject this order? This action cannot be undone.'}
        type="warning"
        showConfirm
        confirmLabel={confirmModal.action === 'approve' ? 'Approve' : 'Reject'}
        onConfirm={() => {
          if (confirmModal.orderId && confirmModal.action) {
            handleStatusChange(confirmModal.orderId, confirmModal.action);
          }
        }}
      />
    </>
  );
};