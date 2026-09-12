'use client';

import { useRef, useState, useEffect } from 'react';
import { Category } from '@/types';

interface CategoryBarProps {
  categories: Category[];
  onSelect?: (categoryId: string | null) => void;
}

export const CategoryBar = ({ categories, onSelect }: CategoryBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollWidth, clientWidth } = scrollRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSelect = (categoryId: string | null) => {
    setSelected(categoryId);
    if (onSelect) onSelect(categoryId);
  };

  return (
    <div className="relative bg-white rounded-2xl px-8 sm:px-10 md:px-12 py-2 sm:py-3 my-4 sm:my-6 shadow-card border border-border">
      <div
        ref={scrollRef}
        className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2"
      >
        <button
          onClick={() => handleSelect(null)}
          className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[70px] md:min-w-[80px] px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-all duration-300 flex-shrink-0 gap-0.5 border-2 border-transparent ${
            selected === null
              ? 'bg-primary border-primary text-white shadow-lg'
              : 'hover:bg-background hover:border-border'
          }`}
        >
          <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm sm:text-base ${
            selected === null ? 'bg-white/20' : 'bg-border-light'
          }`}>
            <i className={`fas fa-th-large ${selected === null ? 'text-white' : 'text-primary'}`}></i>
          </div>
          <span className={`text-[10px] sm:text-xs font-medium text-center whitespace-nowrap ${
            selected === null ? 'text-white' : 'text-text'
          }`}>
            All
          </span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelect(String(category.id))}
            className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[70px] md:min-w-[80px] px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-all duration-300 flex-shrink-0 gap-0.5 border-2 border-transparent ${
              selected === String(category.id)
                ? 'bg-primary border-primary text-white shadow-lg'
                : 'hover:bg-background hover:border-border'
            }`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm sm:text-base ${
              selected === String(category.id) ? 'bg-white/20' : 'bg-border-light'
            }`}>
              <i className={`fas ${category.icon || 'fa-tag'} ${selected === String(category.id) ? 'text-white' : 'text-primary'}`}></i>
            </div>
            <span className={`text-[10px] sm:text-xs font-medium text-center whitespace-nowrap ${
              selected === String(category.id) ? 'text-white' : 'text-text'
            }`}>
              {category.name}
            </span>
          </button>
        ))}
      </div>

      {mounted && showScrollButtons && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-card border border-border flex items-center justify-center transition-all duration-300 hover:bg-primary hover:text-white z-10"
          >
            <i className="fas fa-chevron-left text-xs sm:text-sm"></i>
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-card border border-border flex items-center justify-center transition-all duration-300 hover:bg-primary hover:text-white z-10"
          >
            <i className="fas fa-chevron-right text-xs sm:text-sm"></i>
          </button>
        </>
      )}
    </div>
  );
};