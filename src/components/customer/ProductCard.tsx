'use client';

import { useState } from 'react';
import { Product, Category } from '@/types';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product;
  category?: Category;
}

export const ProductCard = ({ product, category }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(0);
  const variant = product.variants[selectedVariant];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (variant && variant.stock > 0) {
      addToCart(product, selectedVariant);
    }
  };

  const handleCardClick = () => {
    if (variant && variant.stock > 0) {
      addToCart(product, selectedVariant);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl p-3 sm:p-4 shadow-card border border-border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-primary-light hover:shadow-card-lg active:scale-95 flex flex-col"
    >
      <div className="w-full h-[120px] sm:h-[150px] md:h-[180px] rounded-lg overflow-hidden bg-border-light flex items-center justify-center mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => (e.currentTarget.style.display = 'none')}
          loading="lazy"
        />
      </div>

      <div className="flex-1">
        <h4 className="text-sm sm:text-base font-semibold text-text">{product.name}</h4>
        {category && (
          <span className="text-[10px] sm:text-xs uppercase tracking-wider bg-[#e7dcd1] px-2 py-0.5 rounded-full text-text-muted inline-block mt-0.5">
            {category.name}
          </span>
        )}

        {product.variants.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.variants.map((v, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVariant(index);
                }}
                disabled={v.stock <= 0}
                className={`px-2 py-0.5 rounded-full border-2 text-[10px] sm:text-xs font-medium transition-all duration-300 flex items-center gap-1 ${
                  index === selectedVariant
                    ? 'border-primary bg-primary text-white'
                    : v.stock > 0
                    ? 'border-border hover:border-primary-light'
                    : 'opacity-50 cursor-not-allowed line-through'
                }`}
              >
                {v.weight}
                <span className={`text-[8px] sm:text-[10px] font-semibold ${
                  index === selectedVariant ? 'text-white' : 'text-text-light'
                }`}>
                  ₹{v.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className={`text-xs sm:text-sm font-medium mt-1 ${
          variant?.stock > 0 ? 'text-success' : 'text-danger'
        }`}>
          {variant?.stock > 0 ? `✅ In Stock: ${variant.stock}` : '❌ Out of Stock'}
        </div>

        <div className="text-base sm:text-lg font-bold text-primary mt-0.5">
          ₹{variant?.price.toFixed(2) || '0.00'}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!variant || variant.stock <= 0}
          className="w-full mt-2 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary-hover hover:scale-[1.02] disabled:bg-[#d6c9bd] disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <i className="fas fa-plus-circle"></i>
          {variant?.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};