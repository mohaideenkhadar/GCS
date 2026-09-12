'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { Hero } from '@/components/customer/Hero';
import { CategoryBar } from '@/components/customer/CategoryBar';
import { ProductGrid } from '@/components/customer/ProductGrid';
import { OffersSection } from '@/components/customer/OffersSection';
import { CartSlide } from '@/components/customer/CartSlide';
import { CheckoutModal } from '@/components/customer/CheckoutModal';
import { OfferOrderModal } from '@/components/customer/OfferOrderModal';
import { storage } from '@/utils/storage';
import { useCart } from '@/contexts/CartContext';

export default function HomePage() {
  const { cart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [deliveryCharges, setDeliveryCharges] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load initial data once
  useEffect(() => {
    setMounted(true);
    setProducts(storage.getProducts());
    setCategories(storage.getCategories());
    setDeliveryCharges(storage.getDeliveryCharges());
  }, []);

  // Refresh data periodically
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      const newProducts = storage.getProducts();
      const newCategories = storage.getCategories();
      const newDelivery = storage.getDeliveryCharges();
      
      setProducts(prev => {
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(newProducts);
        return prevStr !== newStr ? newProducts : prev;
      });
      
      setCategories(prev => {
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(newCategories);
        return prevStr !== newStr ? newCategories : prev;
      });
      
      setDeliveryCharges(prev => {
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(newDelivery);
        return prevStr !== newStr ? newDelivery : prev;
      });
    }, 10000);
    
    return () => clearInterval(interval);
  }, [mounted]);

  // Cart toggle from navbar
  useEffect(() => {
    const handleCartToggle = () => {
      setIsCartOpen(prev => !prev);
    };

    const cartTrigger = document.querySelector('.cart-trigger');
    if (cartTrigger) {
      cartTrigger.addEventListener('click', handleCartToggle);
    }

    return () => {
      if (cartTrigger) {
        cartTrigger.removeEventListener('click', handleCartToggle);
      }
    };
  }, []);

  // Handle category selection from CategoryBar
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleOpenOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
    setIsOfferModalOpen(true);
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Filter products based on selected category
  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === parseInt(selectedCategory))
    : products;

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl w-full">
          <div className="animate-pulse">
            <div className="h-[300px] bg-border-light rounded-2xl mb-6"></div>
            <div className="h-[100px] bg-border-light rounded-2xl mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-border">
                  <div className="w-full h-[150px] bg-border-light rounded-lg mb-3"></div>
                  <div className="h-4 bg-border-light rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-border-light rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl w-full">
        <Hero />
        
        <OffersSection onOpenOffer={handleOpenOffer} />
        
        <CategoryBar categories={categories} onSelect={handleCategorySelect} />
        
        <ProductGrid products={filteredProducts} categories={categories} />
      </main>

      <Footer />

      <CartSlide
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleOpenCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        deliveryCharges={deliveryCharges}
      />

      <OfferOrderModal
        isOpen={isOfferModalOpen}
        onClose={() => {
          setIsOfferModalOpen(false);
          setSelectedOfferId(null);
        }}
        offerId={selectedOfferId}
        deliveryCharges={deliveryCharges}
      />
    </div>
  );
}