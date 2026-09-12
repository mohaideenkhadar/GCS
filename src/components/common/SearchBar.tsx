'use client';

import { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (term: string) => void;
  className?: string;
  showResults?: boolean;
  resultsCount?: number;
}

export const SearchBar = ({ 
  placeholder = 'Search...', 
  onSearch, 
  className = '',
  showResults = false,
  resultsCount = 0
}: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="relative flex-1 min-w-[200px] sm:min-w-[300px]">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-light text-sm"></i>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleChange}
          className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-primary transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      {showResults && (
        <span className="text-xs text-text-light whitespace-nowrap">
          {resultsCount} results
        </span>
      )}
    </div>
  );
};