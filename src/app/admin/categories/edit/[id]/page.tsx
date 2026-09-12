'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditCategory() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const toast = useToast();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('fa-cake');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categories = storage.getCategories();
    const category = categories.find(c => c.id === id);
    if (category) {
      setName(category.name);
      setIcon(category.icon || 'fa-cake');
    } else {
      toast.error('Category not found!');
      router.push('/admin/categories');
    }
    setLoading(false);
  }, [id, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter category name.');
      return;
    }

    const categories = storage.getCategories();
    const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== id);
    if (existing) {
      toast.error(`Category "${name}" already exists!`);
      return;
    }

    const category = categories.find(c => c.id === id);
    if (!category) {
      toast.error('Category not found!');
      return;
    }

    category.name = name.trim();
    category.icon = icon;
    storage.setCategories(categories);
    toast.success(`✅ "${name}" updated successfully!`);
    router.push('/admin/categories');
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
            Edit Category
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
                <i className="fas fa-save"></i> Update Category
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer isAdmin />
    </div>
  );
}