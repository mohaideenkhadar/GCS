'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { Category, Product } from '@/types';
import { useToast } from '@/hooks/useToast';

export default function AddProduct() {
  const toast = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    image: '',
    variants: [{ weight: '', price: '', stock: '' }],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    setCategories(storage.getCategories());
  }, []);

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { weight: '', price: '', stock: '' }],
    });
  };

  const handleRemoveVariant = (index: number) => {
    if (formData.variants.length <= 1) {
      toast.error('You must have at least one variant.');
      return;
    }
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter product name.');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select a category.');
      return;
    }
    if (!imageFile) {
      toast.error('Please upload an image.');
      return;
    }

    const variants = formData.variants.map(v => ({
      weight: v.weight.trim(),
      price: parseFloat(v.price) || 0,
      stock: parseInt(v.stock) || 0,
    }));

    for (const variant of variants) {
      if (!variant.weight) {
        toast.error('Please enter weight for all variants.');
        return;
      }
      if (variant.price <= 0) {
        toast.error('Please enter valid price for all variants.');
        return;
      }
      if (variant.stock < 0) {
        toast.error('Please enter valid stock for all variants.');
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      const products = storage.getProducts();
      const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

      const newProduct: Product = {
        id: nextId,
        name: formData.name.trim(),
        categoryId: parseInt(formData.categoryId),
        image: imageData,
        variants: variants,
        createdAt: new Date().toISOString(),
      };

      products.push(newProduct);
      storage.setProducts(products);
      toast.success(`✅ "${formData.name}" added successfully!`);
      router.push('/admin/products');
    };
    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      
      <main className="flex-1 container py-4 sm:py-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2 mb-6">
          <i className="fas fa-plus-circle text-secondary"></i>
          Add Product
        </h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-6 border border-border max-w-2xl">
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Badusha, Mysore Pak"
            />
          </div>

          <div className="form-group mt-4">
            <label>Category *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-border">
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-sm text-text">
                <i className="fas fa-weight-hanging mr-1"></i> Product Variants
              </label>
              <button type="button" onClick={handleAddVariant} className="btn btn-small bg-info text-white">
                <i className="fas fa-plus"></i> Add Variant
              </button>
            </div>

            {formData.variants.map((variant, index) => (
              <div key={index} className="flex flex-wrap gap-2 items-center p-2 bg-background rounded-lg border border-border mb-2">
                <input
                  type="text"
                  placeholder="Weight (e.g., 100gm)"
                  value={variant.weight}
                  onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                  className="flex-1 min-w-[80px] p-1.5 border border-border rounded-lg text-sm bg-white"
                />
                <input
                  type="number"
                  placeholder="Price"
                  step="0.01"
                  min="0"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                  className="w-[80px] p-1.5 border border-border rounded-lg text-sm bg-white"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  min="0"
                  value={variant.stock}
                  onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                  className="w-[80px] p-1.5 border border-border rounded-lg text-sm bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(index)}
                  className="w-7 h-7 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] flex items-center justify-center text-danger"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="form-group mt-4">
            <label>Product Image *</label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('imageInput')?.click()}
            >
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-[150px] mx-auto rounded-lg" />
              ) : (
                <div>
                  <i className="fas fa-image text-3xl text-border block mb-2"></i>
                  <p className="text-sm text-text-light">Click to upload image</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => router.back()} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-save"></i> Add Product
            </button>
          </div>
        </form>
      </main>

      <Footer isAdmin />
    </div>
  );
}