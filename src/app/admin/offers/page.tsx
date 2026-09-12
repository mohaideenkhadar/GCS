'use client';

import { useState, useEffect } from 'react';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { Offer, Order } from '@/types';
import { useToast } from '@/hooks/useToast';
import { PopupModal } from '@/components/common/PopupModal';
import { formatDateTime } from '@/utils/helpers';

export default function AdminOffers() {
  const toast = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Offer Modal States
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerName, setOfferName] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerDeadline, setOfferDeadline] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  
  // Offer Booking Details Modal
  const [isOfferDetailsModalOpen, setIsOfferDetailsModalOpen] = useState(false);
  const [selectedOfferDetails, setSelectedOfferDetails] = useState<{ offer: Offer; bookings: Order[] } | null>(null);

  useEffect(() => {
    setMounted(true);
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setOffers(storage.getOffers());
    setOrders(storage.getOrders());
  };

  // ==================== OFFER FUNCTIONS ====================
  const handleOpenOfferModal = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferName(offer.name);
      setOfferAmount(offer.amount.toString());
      setOfferDeadline(offer.deadline);
      setOfferDescription(offer.description || '');
    } else {
      setEditingOffer(null);
      setOfferName('');
      setOfferAmount('');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      setOfferDeadline(tomorrow.toISOString().slice(0, 16));
      setOfferDescription('');
    }
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = () => {
    if (!offerName.trim()) {
      toast.error('Missing Information', 'Please enter offer name.');
      return;
    }
    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) {
      toast.error('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!offerDeadline) {
      toast.error('Missing Information', 'Please select a deadline.');
      return;
    }

    const allOffers = storage.getOffers();
    
    if (editingOffer) {
      // Update existing offer
      const index = allOffers.findIndex(o => o.id === editingOffer.id);
      if (index !== -1) {
        allOffers[index] = {
          ...allOffers[index],
          name: offerName.trim(),
          amount: amount,
          deadline: offerDeadline,
          description: offerDescription.trim() || '',
        };
        storage.setOffers(allOffers);
        loadData();
        setIsOfferModalOpen(false);
        toast.success('Offer Updated', `✅ Offer "${offerName}" updated successfully!`);
      }
    } else {
      // Create new offer
      const newOffer = {
        id: Date.now() + Math.floor(Math.random() * 1000) + '',
        name: offerName.trim(),
        amount: amount,
        deadline: offerDeadline,
        description: offerDescription.trim() || '',
        createdAt: new Date().toISOString(),
        bookedCount: 0,
      };
      allOffers.push(newOffer);
      storage.setOffers(allOffers);
      loadData();
      setIsOfferModalOpen(false);
      toast.success('Offer Created', `✅ Offer "${offerName}" created successfully!`);
    }
  };

  const handleDeleteOffer = (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    const allOffers = storage.getOffers();
    const updated = allOffers.filter(o => o.id !== offerId);
    storage.setOffers(updated);
    loadData();
    toast.success('Offer Deleted', 'Offer has been deleted successfully.');
  };

  const handleViewOfferBookings = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) {
      toast.error('Offer Not Found', 'The offer you selected no longer exists.');
      return;
    }
    
    const bookings = orders.filter(o => o.offerId === offerId && o.isOffer === true);
    setSelectedOfferDetails({ offer, bookings });
    setIsOfferDetailsModalOpen(true);
  };

  // Get total quantity booked for an offer
  const getTotalBookedQty = (offerId: string) => {
    const bookings = orders.filter(o => o.offerId === offerId && o.isOffer === true);
    return bookings.reduce((sum, b) => sum + (b.offerQty || 1), 0);
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-bullhorn text-[#d4a017]"></i>
            Offer Management
            <span className="text-sm font-normal text-text-light ml-2">
              ({offers.length} offers)
            </span>
          </h2>
          <button
            onClick={() => handleOpenOfferModal()}
            className="btn btn-primary bg-[#d4a017] text-white hover:bg-[#d4a017]/80"
          >
            <i className="fas fa-plus"></i> Create Offer
          </button>
        </div>

        {offers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-border">
            <i className="fas fa-bullhorn text-4xl text-border block mb-3"></i>
            <p className="text-text-light">No offers created yet. Click "Create Offer" to add one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => {
              const bookings = orders.filter(o => o.offerId === offer.id && o.isOffer === true);
              const totalBookings = bookings.length;
              const totalQty = getTotalBookedQty(offer.id);
              const totalAmount = bookings.reduce((sum, b) => sum + (b.total || 0), 0);
              const isExpired = new Date(offer.deadline) < new Date();
              
              return (
                <div
                  key={offer.id}
                  className={`bg-white rounded-2xl p-4 border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    isExpired
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-[#d4a017]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-text flex items-center gap-2">
                        <i className={`fas fa-bullhorn ${isExpired ? 'text-gray-400' : 'text-[#d4a017]'}`}></i>
                        {offer.name}
                      </h4>
                      {offer.description && (
                        <p className="text-xs text-text-light mt-0.5">{offer.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isExpired
                        ? 'bg-gray-300 text-gray-600'
                        : 'bg-[#d4a017] text-white'
                    }`}>
                      {isExpired ? 'Expired' : 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                    <div>
                      <span className="text-[10px] text-text-light">Price</span>
                      <p className="font-bold text-[#d4a017]">₹{offer.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-light">Bookings</span>
                      <p className="font-bold text-primary">{totalBookings}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-light">Total Qty</span>
                      <p className="font-bold text-info">{totalQty}</p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-text-light">
                        <i className="far fa-clock mr-1"></i>
                        {new Date(offer.deadline).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleViewOfferBookings(offer.id)}
                          className="px-2 py-0.5 bg-info text-white rounded text-[10px] hover:bg-info/80 transition-colors"
                        >
                          <i className="fas fa-users mr-0.5"></i> {totalBookings}
                        </button>
                        <button
                          onClick={() => handleOpenOfferModal(offer)}
                          className="px-2 py-0.5 bg-[#e1f0e6] text-success rounded text-[10px] hover:bg-[#c8e0d0] transition-colors"
                          title="Edit Offer"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="px-2 py-0.5 bg-[#f7e8d0] text-danger rounded text-[10px] hover:bg-[#f0dcc0] transition-colors"
                          title="Delete Offer"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Show recent bookings */}
                  {totalBookings > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="text-[10px] text-text-light mb-1">Recent Bookings:</div>
                      <div className="max-h-[60px] overflow-y-auto">
                        {bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="flex justify-between text-[10px] py-0.5 border-b border-border/50 last:border-0">
                            <span className="font-medium">{booking.customer}</span>
                            <span className="text-text-light">×{booking.offerQty || 1}</span>
                            <span className="text-success">₹{booking.total.toFixed(2)}</span>
                          </div>
                        ))}
                        {totalBookings > 3 && (
                          <div className="text-[10px] text-text-light text-center mt-0.5">
                            +{totalBookings - 3} more bookings
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ==================== OFFER CREATE/EDIT MODAL ==================== */}
      <PopupModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title={editingOffer ? 'Edit Offer' : 'Create Offer'}
        message=""
        type="info"
        showConfirm={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Offer Name *</label>
            <input
              type="text"
              value={offerName}
              onChange={(e) => setOfferName(e.target.value)}
              placeholder="e.g., Detox, Millet Bowl"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Amount (₹) *</label>
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Deadline (Date & Time) *</label>
            <input
              type="datetime-local"
              value={offerDeadline}
              onChange={(e) => setOfferDeadline(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Description (Optional)</label>
            <textarea
              value={offerDescription}
              onChange={(e) => setOfferDescription(e.target.value)}
              rows={2}
              placeholder="Additional details about the offer..."
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-y"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsOfferModalOpen(false)} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button onClick={handleSaveOffer} className="btn btn-primary flex-1 bg-[#d4a017] text-white hover:bg-[#d4a017]/80">
              <i className="fas fa-save"></i> {editingOffer ? 'Update Offer' : 'Create Offer'}
            </button>
          </div>
        </div>
      </PopupModal>

      {/* ==================== OFFER BOOKINGS DETAILS MODAL ==================== */}
      <PopupModal
        isOpen={isOfferDetailsModalOpen}
        onClose={() => {
          setIsOfferDetailsModalOpen(false);
          setSelectedOfferDetails(null);
        }}
        title={`Offer Bookings: ${selectedOfferDetails?.offer?.name || ''}`}
        message=""
        type="info"
        showConfirm={false}
      >
        {selectedOfferDetails && (
          <div className="space-y-4">
            <div className="bg-[#f0e6b0] p-3 rounded-xl border-2 border-[#d4a017]">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="text-xs text-text-light">Offer Name</span>
                  <p className="font-bold text-text">{selectedOfferDetails.offer.name}</p>
                </div>
                <div>
                  <span className="text-xs text-text-light">Amount</span>
                  <p className="font-bold text-[#d4a017]">₹{selectedOfferDetails.offer.amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-text-light">Total Bookings</span>
                  <p className="font-bold text-primary">{selectedOfferDetails.bookings.length}</p>
                </div>
                <div>
                  <span className="text-xs text-text-light">Total Qty</span>
                  <p className="font-bold text-info">{selectedOfferDetails.bookings.reduce((sum, b) => sum + (b.offerQty || 1), 0)}</p>
                </div>
                <div>
                  <span className="text-xs text-text-light">Deadline</span>
                  <p className={`text-sm font-semibold ${new Date(selectedOfferDetails.offer.deadline) < new Date() ? 'text-gray-500' : 'text-danger'}`}>
                    {new Date(selectedOfferDetails.offer.deadline).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {selectedOfferDetails.offer.description && (
                <p className="text-sm text-text-light mt-2 border-t border-[#d4a017]/30 pt-2">
                  {selectedOfferDetails.offer.description}
                </p>
              )}
            </div>

            {selectedOfferDetails.bookings.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-box-open text-4xl text-border block mb-3"></i>
                <p className="text-text-light">No bookings for this offer yet.</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px]">#</th>
                      <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px]">Customer</th>
                      <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px]">Qty</th>
                      <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px]">Total</th>
                      <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px]">Date</th>
                      <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOfferDetails.bookings.map((booking, idx) => (
                      <tr key={booking.id} className="border-b border-border-light hover:bg-border-light/50 transition-colors">
                        <td className="py-2 px-2 font-bold text-primary">#{idx + 1}</td>
                        <td className="py-2 px-2 font-medium">{booking.customer}</td>
                        <td className="py-2 px-2 text-center">{booking.offerQty || 1}</td>
                        <td className="py-2 px-2 font-semibold">₹{booking.total.toFixed(2)}</td>
                        <td className="py-2 px-2 text-[10px]">{formatDateTime(booking.createdAt)}</td>
                        <td className="py-2 px-2">
                          <span className={`status-badge ${
                            booking.status === 'completed' ? 'bg-success text-white' :
                            booking.status === 'rejected' ? 'bg-danger text-white' :
                            'bg-warning text-white'
                          }`}>
                            {booking.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </PopupModal>

      <Footer isAdmin />
    </div>
  );
}