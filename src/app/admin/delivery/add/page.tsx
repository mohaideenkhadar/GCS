'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { DeliveryCharge } from '@/types';
import { useToast } from '@/hooks/useToast';

export default function AddDelivery() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [charge, setCharge] = useState('');
  const toast = useToast();

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
    if (deliveryCharges.some(d => d.location.toLowerCase() === location.toLowerCase())) {
      toast.error(`Location "${location}" already exists!`);
      return;
    }

    const nextId = deliveryCharges.length > 0 ? Math.max(...deliveryCharges.map(d => d.id)) + 1 : 1;
    const newDelivery: DeliveryCharge = {
      id: nextId,
      location: location.trim(),
      charge: chargeValue,
    };

    deliveryCharges.push(newDelivery);
    storage.setDeliveryCharges(deliveryCharges);
    toast.success(`✅ "${location}" added successfully! (₹${chargeValue.toFixed(2)})`);
    router.push('/admin/delivery');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-plus-circle text-secondary"></i>
            Add Delivery Charge
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
                <i className="fas fa-save"></i> Add Delivery Charge
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer isAdmin />
    </div>
  );
}