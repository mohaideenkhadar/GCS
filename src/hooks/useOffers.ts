'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/utils/storage';
import { Offer } from '@/types';

export const useOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = () => {
    const allOffers = storage.getOffers();
    setOffers(allOffers);
    
    const now = new Date();
    const active = allOffers.filter(o => {
      if (o.deadline) {
        const deadline = new Date(o.deadline);
        return deadline > now;
      }
      return true;
    });
    setActiveOffers(active);
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
    const interval = setInterval(loadOffers, 5000);
    return () => clearInterval(interval);
  }, []);

  const createOffer = (offer: Omit<Offer, 'id' | 'createdAt' | 'bookedCount'>) => {
    const allOffers = storage.getOffers();
    const newOffer: Offer = {
      ...offer,
      id: Date.now() + Math.floor(Math.random() * 1000) + '',
      createdAt: new Date().toISOString(),
      bookedCount: 0,
    };
    allOffers.push(newOffer);
    storage.setOffers(allOffers);
    loadOffers();
    return newOffer;
  };

  const deleteOffer = (id: string) => {
    const allOffers = storage.getOffers();
    const filtered = allOffers.filter(o => o.id !== id);
    storage.setOffers(filtered);
    loadOffers();
  };

  const getOfferById = (id: string) => {
    return offers.find(o => o.id === id);
  };

  return {
    offers,
    activeOffers,
    loading,
    createOffer,
    deleteOffer,
    getOfferById,
    refresh: loadOffers,
  };
};