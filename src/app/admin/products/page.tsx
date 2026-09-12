'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { PopupModal } from '@/components/common/PopupModal';
import { storage } from '@/utils/storage';
import { Product, Category } from '@/types';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: number | null; productName: string }>({
    isOpen: false,
    productId: null,
    productName: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(storage.getProducts());
    setCategories(storage.getCategories());
  };

  const filteredProducts = products.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) ||
      p.categoryId.toString().includes(term) ||
      p.variants.some(v => v.weight.toLowerCase().includes(term));
  });

  // Get total stock for a product
  const getTotalStock = (product: Product) => {
    return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  };

  const handleDelete = () => {
    if (deleteModal.productId === null) return;
    const updated = products.filter(p => p.id !== deleteModal.productId);
    storage.setProducts(updated);
    setProducts(updated);
    setDeleteModal({ isOpen: false, productId: null, productName: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-utensils text-secondary"></i>
            Products
            <span className="text-sm font-normal text-text-light ml-2">
              ({filteredProducts.length} items)
            </span>
          </h2>
          <Link href="/admin/products/add" className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-all duration-300 text-sm sm:text-base">
            <i className="fas fa-plus-circle"></i>
            Add Product
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[300px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-light text-sm"></i>
            <input
              type="text"
              placeholder="Search by Product Name, Category, or Variant..."
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
            {filteredProducts.length} results
          </span>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-border shadow-card overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <i className="fas fa-box-open text-4xl sm:text-5xl text-border block mb-3"></i>
              <p className="text-text-light">No products yet. <Link href="/admin/products/add" className="text-primary hover:underline">Add one</Link></p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">#</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Image</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Name</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Category</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Variants</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Stock</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, i) => {
                    const cat = categories.find(c => c.id === p.categoryId);
                    const variantDisplay = p.variants.map(v => `${v.weight} (₹${v.price.toFixed(2)})`).join(', ');
                    const totalStock = getTotalStock(p);
                    const stockStatus = totalStock <= 0 ? 'Out of Stock' : totalStock <= 5 ? 'Low Stock' : 'In Stock';
                    const stockColor = totalStock <= 0 ? 'text-danger' : totalStock <= 5 ? 'text-warning' : 'text-success';
                    
                    return (
                      <tr key={p.id} className="border-b border-border-light hover:bg-border-light/50 transition-colors">
                        <td className="py-2 px-2 font-medium">{i + 1}</td>
                        <td className="py-2 px-2">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-border bg-border-light flex-shrink-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                        </td>
                        <td className="py-2 px-2 font-medium text-text">{p.name}</td>
                        <td className="py-2 px-2">
                          <span className="inline-block px-2 py-0.5 bg-[#e7dcd1] rounded-full text-[10px] sm:text-xs text-text-muted">
                            {cat ? cat.name : 'Uncategorized'}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span className="text-[10px] sm:text-xs text-text-light truncate block max-w-[120px]">
                            {variantDisplay || 'No variants'}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex flex-col">
                            <span className={`font-semibold ${stockColor}`}>
                              {totalStock}
                            </span>
                            <span className={`text-[8px] ${stockColor}`}>
                              {stockStatus}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/admin/products/view/${p.id}`}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#d6e4f0] hover:bg-[#b8cde0] flex items-center justify-center transition-colors duration-200"
                              title="View"
                            >
                              <i className="fas fa-eye text-info text-xs sm:text-sm"></i>
                            </Link>
                            <Link
                              href={`/admin/products/edit/${p.id}`}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#e1f0e6] hover:bg-[#c8e0d0] flex items-center justify-center transition-colors duration-200"
                              title="Edit"
                            >
                              <i className="fas fa-edit text-success text-xs sm:text-sm"></i>
                            </Link>
                            <Link
                              href={`/admin/stock`}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f0e6dc] hover:bg-[#e0d6cc] flex items-center justify-center transition-colors duration-200"
                              title="Manage Stock"
                            >
                              <i className="fas fa-boxes text-primary text-xs sm:text-sm"></i>
                            </Link>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, productId: p.id, productName: p.name })}
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
        onClose={() => setDeleteModal({ isOpen: false, productId: null, productName: '' })}
        title="Confirm Delete"
        message={`Delete product "${deleteModal.productName}"?`}
        type="warning"
        showConfirm
        confirmLabel="Yes"
        onConfirm={handleDelete}
      />

      <Footer isAdmin />
    </div>
  );
}