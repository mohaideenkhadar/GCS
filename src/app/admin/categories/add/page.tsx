'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { Category } from '@/types';
import { useToast } from '@/hooks/useToast';

const ICON_OPTIONS = [
  { value: 'fa-cake', label: '🍰 Cake' },
  { value: 'fa-bread', label: '🍞 Bread' },
  { value: 'fa-cookie', label: '🍪 Cookie' },
  { value: 'fa-candy-cane', label: '🍬 Candy' },
  { value: 'fa-ice-cream', label: '🍦 Ice Cream' },
  { value: 'fa-pizza', label: '🍕 Pizza' },
  { value: 'fa-coffee', label: '☕ Coffee' },
  { value: 'fa-cheese', label: '🧀 Cheese' },
  { value: 'fa-hamburger', label: '🍔 Burger' },
];

export default function AddCategory() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('fa-cake');
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter category name.');
      return;
    }

    const categories = storage.getCategories();
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`Category "${name}" already exists!`);
      return;
    }

    const nextId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const newCategory: Category = {
      id: nextId,
      name: name.trim(),
      icon,
    };

    categories.push(newCategory);
    storage.setCategories(categories);
    toast.success(`✅ "${name}" added successfully!`);
    router.push('/admin/categories');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-plus-circle text-secondary"></i>
            Add Category
          </h2>
        </div>

        <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-card">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block font-semibold text-text mb-1 text-sm">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Desserts"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block font-semibold text-text mb-1 text-sm">Icon</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
                <i className="fas fa-save"></i> Add Category
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer isAdmin />
    </div>
  );
}