'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { Product, Category } from '@/types';
import { useToast } from '@/hooks/useToast';

export default function ViewProduct() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const products = storage.getProducts();
    const found = products.find(p => p.id === id);
    if (found) {
      setProduct(found);
      const categories = storage.getCategories();
      const cat = categories.find(c => c.id === found.categoryId);
      setCategory(cat || null);
    } else {
      toast.error('Product not found!');
      router.push('/admin/products');
    }
    setLoading(false);
  }, [id, router]);

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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AdminNavbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-white rounded-2xl p-8 text-center border border-border">
            <i className="fas fa-exclamation-triangle text-4xl text-warning block mb-3"></i>
            <p className="text-text-light">Product not found</p>
          </div>
        </main>
        <Footer isAdmin />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-4xl w-full">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-eye text-secondary"></i>
            Product Details
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-card">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="md:w-1/3">
              <div className="bg-border-light rounded-xl overflow-hidden border border-border">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23e8d9cc"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%237c6856" font-family="sans-serif" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>

            <div className="md:w-2/3 space-y-3">
              <div>
                <h3 className="text-2xl font-bold text-text">{product.name}</h3>
                {category && (
                  <span className="inline-block mt-1 px-3 py-1 bg-[#e7dcd1] rounded-full text-sm text-text-muted">
                    <i className={`fas ${category.icon || 'fa-tag'} mr-1`}></i>
                    {category.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-light">Product ID:</span>
                  <span className="ml-2 font-medium">#{product.id}</span>
                </div>
                <div>
                  <span className="text-text-light">Created:</span>
                  <span className="ml-2 font-medium">
                    {new Date(product.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-text mb-3">
                  <i className="fas fa-weight-hanging mr-2"></i>
                  Variants
                </h4>
                {product.variants.length === 0 ? (
                  <p className="text-text-light text-sm">No variants available.</p>
                ) : (
                  <div className="space-y-2">
                    {product.variants.map((v, index) => (
                      <div key={index} className="flex flex-wrap items-center justify-between p-3 bg-background rounded-lg border border-border">
                        <span className="font-medium text-text">{v.weight}</span>
                        <span className="text-primary font-semibold">₹{v.price.toFixed(2)}</span>
                        <span className={v.stock > 0 ? 'text-success' : 'text-danger'}>
                          {v.stock > 0 ? `✅ In Stock: ${v.stock}` : '❌ Out of Stock'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Link href="/admin/products" className="btn btn-outline">
                  <i className="fas fa-arrow-left"></i> Back
                </Link>
                <Link href={`/admin/products/edit/${product.id}`} className="btn btn-primary">
                  <i className="fas fa-edit"></i> Edit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer isAdmin />
    </div>
  );
}