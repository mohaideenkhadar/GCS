'use client';

import Link from 'next/link';
import { Category } from '@/types';

interface CategoriesTableProps {
  categories: Category[];
  onDelete: (id: number) => void;
}

export const CategoriesTable = ({ categories, onDelete }: CategoriesTableProps) => {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-tags text-4xl text-border block mb-3"></i>
        <p className="text-text-light">No categories yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[400px] text-sm">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs">#</th>
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs">Category</th>
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs hidden sm:table-cell">Products</th>
            <th className="text-left py-3 px-3 font-semibold text-[#4f3b2c] uppercase tracking-wider text-xs">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c, i) => (
            <tr key={c.id} className="border-b border-border-light hover:bg-border-light/50 transition-colors">
              <td className="py-3 px-3">{i + 1}</td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <i className={`fas ${c.icon || 'fa-tag'} text-primary-light`}></i>
                  <span className="font-medium">{c.name}</span>
                </div>
              </td>
              <td className="py-3 px-3 hidden sm:table-cell text-text-light">0 products</td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/categories/edit/${c.id}`}
                    className="p-2 rounded-full bg-[#e1f0e6] hover:bg-[#c8e0d0] transition-colors"
                    title="Edit"
                  >
                    <i className="fas fa-edit text-success text-xs"></i>
                  </Link>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="p-2 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] transition-colors"
                    title="Delete"
                  >
                    <i className="fas fa-trash text-danger text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};