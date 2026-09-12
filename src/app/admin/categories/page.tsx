'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { PopupModal } from '@/components/common/PopupModal';
import { storage } from '@/utils/storage';
import { Category } from '@/types';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; name: string }>({
    isOpen: false,
    id: null,
    name: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCategories(storage.getCategories());
  };

  const filteredCategories = categories.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) ||
      c.icon?.toLowerCase().includes(term);
  });

  const handleDelete = () => {
    if (deleteModal.id === null) return;
    const updated = categories.filter(c => c.id !== deleteModal.id);
    storage.setCategories(updated);
    setCategories(updated);
    setDeleteModal({ isOpen: false, id: null, name: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-tags text-secondary"></i>
            Categories
            <span className="text-sm font-normal text-text-light ml-2">
              ({filteredCategories.length} items)
            </span>
          </h2>
          <Link href="/admin/categories/add" className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-all duration-300 text-sm sm:text-base">
            <i className="fas fa-plus-circle"></i>
            Add Category
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[300px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-light text-sm"></i>
            <input
              type="text"
              placeholder="Search by Category Name or Icon..."
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
          <span className="text-xs text-text-light">
            {filteredCategories.length} results
          </span>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 border border-border shadow-card overflow-hidden">
          {categories.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <i className="fas fa-tags text-4xl sm:text-5xl text-border block mb-3"></i>
              <p className="text-text-light text-sm sm:text-base">
                No categories yet. 
                <Link href="/admin/categories/add" className="text-primary hover:underline ml-1">
                  Add one
                </Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full min-w-[400px] md:min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2 px-2 sm:px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">#</th>
                    <th className="text-left py-2 px-2 sm:px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Category</th>
                    <th className="text-left py-2 px-2 sm:px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs hidden sm:table-cell">Products</th>
                    <th className="text-left py-2 px-2 sm:px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c, i) => {
                    const products = storage.getProducts();
                    const count = products.filter(p => p.categoryId === c.id).length;
                    return (
                      <tr key={c.id} className="border-b border-border-light hover:bg-border-light/50 transition-colors">
                        <td className="py-2 px-2 sm:px-3 font-medium">{i + 1}</td>
                        <td className="py-2 px-2 sm:px-3">
                          <div className="flex items-center gap-2">
                            <i className={`fas ${c.icon || 'fa-tag'} text-primary-light`}></i>
                            <span className="font-medium text-text">{c.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 sm:px-3 hidden sm:table-cell text-text-light">{count} products</td>
                        <td className="py-2 px-2 sm:px-3">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/categories/edit/${c.id}`}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#e1f0e6] hover:bg-[#c8e0d0] flex items-center justify-center transition-colors duration-200"
                              title="Edit"
                            >
                              <i className="fas fa-edit text-success text-xs sm:text-sm"></i>
                            </Link>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, id: c.id, name: c.name })}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] flex items-center justify-center transition-colors duration-200"
                              title="Delete"
                            >
                              <i className="fas fa-trash text-danger text-xs sm:text-sm"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <PopupModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        title="Confirm Delete"
        message={`Delete category "${deleteModal.name}"?`}
        type="warning"
        showConfirm
        confirmLabel="Yes"
        onConfirm={handleDelete}
      />

      <Footer isAdmin />
    </div>
  );
}