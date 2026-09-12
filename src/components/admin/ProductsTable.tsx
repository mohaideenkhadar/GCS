'use client';

import Link from 'next/link';
import { Product, Category } from '@/types';

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
  onDelete: (id: number) => void;
}

export const ProductsTable = ({ products, categories, onDelete }: ProductsTableProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-box-open text-4xl text-border block mb-3"></i>
        <p className="text-text-light">No products yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs">#</th>
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs">Image</th>
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs">Name</th>
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs hidden sm:table-cell">Category</th>
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs hidden md:table-cell">Variants</th>
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => {
            const cat = categories.find(c => c.id === p.categoryId);
            const variantDisplay = p.variants.map(v => `${v.weight} (₹${v.price.toFixed(2)})`).join(', ');
            return (
              <tr key={p.id} className="border-b border-border-light hover:bg-border-light/50 transition-colors">
                <td className="py-3 px-3">{i + 1}</td>
                <td className="py-3 px-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-border-light flex-shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                </td>
                <td className="py-3 px-3 font-medium">{p.name}</td>
                <td className="py-3 px-3 hidden sm:table-cell">
                  <span className="inline-block px-2 py-0.5 bg-[#e7dcd1] rounded-full text-xs text-text-muted">
                    {cat ? cat.name : 'Uncategorized'}
                  </span>
                </td>
                <td className="py-3 px-3 hidden md:table-cell">
                  <span className="text-xs text-text-light truncate block max-w-[150px]">
                    {variantDisplay || 'No variants'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products/view/${p.id}`}
                      className="p-2 rounded-full bg-[#d6e4f0] hover:bg-[#b8cde0] transition-colors"
                      title="View"
                    >
                      <i className="fas fa-eye text-info text-xs"></i>
                    </Link>
                    <Link
                      href={`/admin/products/edit/${p.id}`}
                      className="p-2 rounded-full bg-[#e1f0e6] hover:bg-[#c8e0d0] transition-colors"
                      title="Edit"
                    >
                      <i className="fas fa-edit text-success text-xs"></i>
                    </Link>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-2 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] transition-colors"
                      title="Delete"
                    >
                      <i className="fas fa-trash text-danger text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};