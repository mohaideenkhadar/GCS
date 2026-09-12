'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { useToast } from '@/hooks/useToast';

export default function EditDelivery() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const toast = useToast();

  const [location, setLocation] = useState('');
  const [charge, setCharge] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deliveryCharges = storage.getDeliveryCharges();
    const delivery = deliveryCharges.find(d => d.id === id);
    if (delivery) {
      setLocation(delivery.location);
      setCharge(delivery.charge.toString());
    } else {
      toast.error('Delivery charge not found!');
      router.push('/admin/delivery');
    }
    setLoading(false);
  }, [id, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim()) {
      toast.error('Please enter location name.');
      return;
    }

    const chargeValue = parseFloat(charge);
    if (isNaN(chargeValue) || chargeValue < 0) {
      toast.error('Please enter a valid delivery charge.');
      return;
    }

    const deliveryCharges = storage.getDeliveryCharges();
    const existing = deliveryCharges.find(d => d.location.toLowerCase() === location.toLowerCase() && d.id !== id);
    if (existing) {
      toast.error(`Location "${location}" already exists!`);
      return;
    }

    const delivery = deliveryCharges.find(d => d.id === id);
    if (!delivery) {
      toast.error('Delivery charge not found!');
      return;
    }

    delivery.location = location.trim();
    delivery.charge = chargeValue;
    storage.setDeliveryCharges(deliveryCharges);
    toast.success(`✅ "${location}" updated successfully! (₹${chargeValue.toFixed(2)})`);
    router.push('/admin/delivery');
  };

  if (loading) {
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
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-edit text-secondary"></i>
            Edit Delivery Charge
          </h2>
        </div>

        <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-card">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block font-semibold text-text mb-1 text-sm">Location Name *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., KKNagar"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block font-semibold text-text mb-1 text-sm">Delivery Charge (₹) *</label>
              <input
                type="number"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save"></i> Update Delivery Charge
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer isAdmin />
    </div>
  );
}