'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
}

export const ProductGrid = ({ products, categories }: ProductGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter products by category and search term
  const filteredProducts = products.filter(p => {
    // Category filter
    if (selectedCategory && p.categoryId !== parseInt(selectedCategory)) {
      return false;
    }
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(term) ||
        p.variants.some(v => v.weight.toLowerCase().includes(term));
    }
    return true;
  });

  if (!mounted) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <i className="fas fa-store text-primary-light text-lg sm:text-xl"></i>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-text">
            Our Products
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-border animate-pulse">
              <div className="w-full h-[120px] sm:h-[150px] md:h-[180px] bg-border-light rounded-lg mb-3"></div>
              <div className="h-4 bg-border-light rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-border-light rounded w-1/2 mb-2"></div>
              <div className="h-5 bg-border-light rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <i className="fas fa-store text-primary-light text-lg sm:text-xl"></i>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-text">
            Our Products
          </h2>
          <span className="text-xs sm:text-sm font-light text-text-light">
            ({filteredProducts.length} items)
          </span>
        </div>
        
        {/* Search Bar for Customer */}
        <div className="relative w-full sm:w-64">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-light text-sm"></i>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-primary transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-text-light">
          <i className="fas fa-box-open text-5xl block mb-3 text-border"></i>
          <p className="text-sm sm:text-base">No products found matching your search.</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-primary hover:underline text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filteredProducts.map((product) => {
            const category = categories.find(c => c.id === product.categoryId);
            return <ProductCard key={product.id} product={product} category={category} />;
          })}
        </div>
      )}
    </>
  );
};