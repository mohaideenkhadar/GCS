'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { Category, Product } from '@/types';
import { useToast } from '@/hooks/useToast';

export default function EditProduct() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    image: '',
    variants: [{ weight: '', price: '', stock: '' }],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const categoriesList = storage.getCategories();
    setCategories(categoriesList);

    const products = storage.getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
      setFormData({
        name: product.name,
        categoryId: product.categoryId.toString(),
        image: product.image,
        variants: product.variants.map(v => ({
          weight: v.weight,
          price: v.price.toString(),
          stock: v.stock.toString(),
        })),
      });
      setImagePreview(product.image);
    } else {
      toast.error('Product not found!');
      router.push('/admin/products');
    }
    setLoading(false);
  }, [id, router]);

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

    const products = storage.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) {
      toast.error('Product not found!');
      return;
    }

    product.name = formData.name.trim();
    product.categoryId = parseInt(formData.categoryId);
    product.variants = variants;

    const updateProduct = (imageData?: string) => {
      if (imageData) {
        product.image = imageData;
      }
      storage.setProducts(products);
      toast.success(`✅ "${formData.name}" updated successfully!`);
      router.push('/admin/products');
    };

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateProduct(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      updateProduct();
    }
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
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-3xl w-full">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-edit text-secondary"></i>
            Edit Product
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-card">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block font-semibold text-text mb-1 text-sm">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Badusha, Mysore Pak"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold text-text mb-1 text-sm">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
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
                <div key={index} className="flex flex-wrap gap-2 items-center p-3 bg-background rounded-lg border border-border mb-2">
                  <input
                    type="text"
                    placeholder="Weight (e.g., 100gm)"
                    value={variant.weight}
                    onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                    className="flex-1 min-w-[80px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    step="0.01"
                    min="0"
                    value={variant.price}
                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                    className="w-[80px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    min="0"
                    value={variant.stock}
                    onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                    className="w-[80px] px-3 py-2 border border-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    className="w-8 h-8 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] flex items-center justify-center text-danger transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block font-semibold text-text mb-1 text-sm">Product Image</label>
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
                <i className="fas fa-save"></i> Update Product
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer isAdmin />
    </div>
  );
}