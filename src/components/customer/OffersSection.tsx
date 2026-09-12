'use client';

import { useState, useEffect } from 'react';
import { getActiveOffers } from '@/utils/helpers';

interface OffersSectionProps {
  onOpenOffer: (offerId: string) => void;
}

export const OffersSection = ({ onOpenOffer }: OffersSectionProps) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load offers only once on mount
    setOffers(getActiveOffers());
    
    // Set up interval for refreshing offers
    const interval = setInterval(() => {
      const activeOffers = getActiveOffers();
      setOffers(activeOffers);
    }, 30000); // Refresh every 30 seconds instead of 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div id="offers" className="my-6 sm:my-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <i className="fas fa-bullhorn text-[#d4a017] text-lg sm:text-xl"></i>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-text">
            Special Offers
          </h2>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center border border-border animate-pulse">
          <div className="h-20 bg-border-light rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div id="offers" className="my-6 sm:my-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <i className="fas fa-bullhorn text-[#d4a017] text-lg sm:text-xl"></i>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-text">
            Special Offers
          </h2>
          <span className="text-xs sm:text-sm font-light text-text-light">(0)</span>
        </div>
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border-2 border-dashed border-border">
          <i className="fas fa-bullhorn text-3xl sm:text-4xl block mb-3 text-[#d4a017]"></i>
          <p className="text-sm sm:text-base text-text-light">
            No special offers available right now. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="offers" className="my-6 sm:my-8">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <i className="fas fa-bullhorn text-[#d4a017] text-lg sm:text-xl"></i>
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-text">
          Special Offers
        </h2>
        <span className="text-xs sm:text-sm font-light text-text-light">
          ({offers.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {offers.map((offer) => {
          const deadline = new Date(offer.deadline);
          return (
            <div
              key={offer.id}
              onClick={() => onOpenOffer(offer.id)}
              className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#d4a017] shadow-card transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(212,160,23,0.25)]"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="text-[#d4a017] font-semibold text-sm sm:text-base">
                    <i className="fas fa-bullhorn mr-1"></i>
                    {offer.name}
                  </h4>
                  {offer.description && (
                    <p className="text-xs sm:text-sm text-text-light mt-0.5">
                      {offer.description}
                    </p>
                  )}
                </div>
                <span className="bg-[#d4a017] text-white px-2 sm:px-3 py-0.5 rounded-full text-sm sm:text-base font-bold whitespace-nowrap">
                  ₹{offer.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-border">
                <span className="text-[10px] sm:text-xs text-text-light">
                  <i className="fas fa-clock text-[#d4a017]"></i>
                  {' '}
                  Deadline: {deadline.toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenOffer(offer.id);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#d4a017] text-white rounded-full text-xs font-semibold hover:bg-[#d4a017]/80 transition-all duration-300"
                >
                  <i className="fas fa-shopping-bag"></i> Book Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};