'use client';

import { useState, useEffect } from 'react';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Footer } from '@/components/common/Footer';
import { storage } from '@/utils/storage';
import { Product } from '@/types';
import { useToast } from '@/hooks/useToast';
import { PopupModal } from '@/components/common/PopupModal';

// Stock Entry Type
interface StockEntry {
  id: number;
  productId: number;
  productName: string;
  variant: string;
  date: string;
  stockIn: number;
  stockOut: number;
  returned: number;
  note: string;
}

export default function AdminStock() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    variant: '',
    stockIn: '',
    stockOut: '',
    returned: '',
    note: '',
  });

  // Load data
  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = () => {
    setProducts(storage.getProducts());
    // Load stock entries from localStorage
    const saved = localStorage.getItem('sugar_spice_stock_entries');
    if (saved) {
      try {
        setStockEntries(JSON.parse(saved));
      } catch {
        setStockEntries([]);
      }
    }
  };

  // Save stock entries
  const saveStockEntries = (entries: StockEntry[]) => {
    localStorage.setItem('sugar_spice_stock_entries', JSON.stringify(entries));
    setStockEntries(entries);
  };

  // Get filtered entries for selected date
  const getFilteredEntries = () => {
    return stockEntries.filter(entry => entry.date === selectedDate);
  };

  // Get product name by ID
  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  // Handle form submit
  const handleSubmit = () => {
    if (!formData.productId) {
      toast.error('Missing Information', 'Please select a product.');
      return;
    }
    if (!formData.stockIn && !formData.stockOut) {
      toast.error('Missing Information', 'Please enter either Stock In or Stock Out.');
      return;
    }

    const stockIn = parseInt(formData.stockIn) || 0;
    const stockOut = parseInt(formData.stockOut) || 0;
    const returned = parseInt(formData.returned) || 0;

    const newEntry: StockEntry = {
      id: editingEntry?.id || Date.now() + Math.floor(Math.random() * 1000),
      productId: parseInt(formData.productId),
      productName: getProductName(parseInt(formData.productId)),
      variant: formData.variant || 'N/A',
      date: selectedDate,
      stockIn: stockIn,
      stockOut: stockOut,
      returned: returned,
      note: formData.note || '',
    };

    let updatedEntries: StockEntry[];
    if (editingEntry) {
      updatedEntries = stockEntries.map(e => e.id === editingEntry.id ? newEntry : e);
    } else {
      updatedEntries = [newEntry, ...stockEntries];
    }

    saveStockEntries(updatedEntries);
    setIsModalOpen(false);
    resetForm();
    toast.success(editingEntry ? 'Stock Updated' : 'Stock Added', 
      `${editingEntry ? 'Updated' : 'Added'} stock entry for ${getProductName(parseInt(formData.productId))}`);
  };

  // Delete entry
  const handleDelete = (id: number) => {
    if (!confirm('Delete this stock entry?')) return;
    const updated = stockEntries.filter(e => e.id !== id);
    saveStockEntries(updated);
    toast.success('Deleted', 'Stock entry deleted successfully.');
  };

  // Edit entry
  const handleEdit = (entry: StockEntry) => {
    setEditingEntry(entry);
    setFormData({
      productId: entry.productId.toString(),
      variant: entry.variant,
      stockIn: entry.stockIn.toString(),
      stockOut: entry.stockOut.toString(),
      returned: entry.returned.toString(),
      note: entry.note || '',
    });
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      productId: '',
      variant: '',
      stockIn: '',
      stockOut: '',
      returned: '',
      note: '',
    });
  };

  // Get today's summary
  const getTodaySummary = () => {
    const todayEntries = getFilteredEntries();
    let totalIn = 0, totalOut = 0, totalReturned = 0;
    todayEntries.forEach(e => {
      totalIn += e.stockIn;
      totalOut += e.stockOut;
      totalReturned += e.returned || 0;
    });
    return { totalIn, totalOut, totalReturned, count: todayEntries.length };
  };

  // Get product options
  const productOptions = products.map(p => ({
    id: p.id,
    name: p.name,
    variants: p.variants.map(v => v.weight),
  }));

  if (!mounted) {
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

  const summary = getTodaySummary();
  const filteredEntries = getFilteredEntries();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminNavbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-text flex items-center gap-2">
            <i className="fas fa-boxes text-secondary"></i>
            Stock Management
          </h2>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <i className="fas fa-plus"></i> Add Stock Entry
          </button>
        </div>

        {/* Date Picker and Summary */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-border shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-sm text-text">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-light">Entries:</span>
                <span className="font-bold text-text">{summary.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-light">Stock In:</span>
                <span className="font-bold text-success">{summary.totalIn}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-light">Stock Out:</span>
                <span className="font-bold text-danger">{summary.totalOut}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-light">Returned:</span>
                <span className="font-bold text-warning">{summary.totalReturned}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Entries Table */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-border shadow-card overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <i className="fas fa-box-open text-4xl sm:text-5xl text-border block mb-3"></i>
              <p className="text-text-light">No stock entries for this date.</p>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="mt-2 text-primary hover:underline text-sm"
              >
                Add stock entry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">#</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Product</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Variant</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Stock In</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Stock Out</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Returned</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Note</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#4f3b2c] uppercase tracking-wider text-[10px] sm:text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <tr key={entry.id} className="border-b border-border-light hover:bg-border-light/50 transition-colors">
                      <td className="py-2 px-2">{index + 1}</td>
                      <td className="py-2 px-2 font-medium">{entry.productName}</td>
                      <td className="py-2 px-2 text-text-light">{entry.variant}</td>
                      <td className="py-2 px-2 text-success font-semibold">{entry.stockIn > 0 ? entry.stockIn : '-'}</td>
                      <td className="py-2 px-2 text-danger font-semibold">{entry.stockOut > 0 ? entry.stockOut : '-'}</td>
                      <td className="py-2 px-2 text-warning font-semibold">{entry.returned > 0 ? entry.returned : '-'}</td>
                      <td className="py-2 px-2 text-text-light max-w-[100px] truncate">{entry.note || '-'}</td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-1.5 rounded-full bg-[#e1f0e6] hover:bg-[#c8e0d0] transition-colors"
                            title="Edit"
                          >
                            <i className="fas fa-edit text-success text-xs"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 rounded-full bg-[#f7e8d0] hover:bg-[#f0dcc0] transition-colors"
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
          )}
        </div>
      </main>

      {/* Add/Edit Stock Modal */}
      <PopupModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingEntry ? 'Edit Stock Entry' : 'Add Stock Entry'}
        message=""
        type="info"
        showConfirm={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Product *</label>
            <select
              value={formData.productId}
              onChange={(e) => {
                setFormData({ ...formData, productId: e.target.value, variant: '' });
              }}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="">Select Product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Variant</label>
            <select
              value={formData.variant}
              onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-white"
            >
              <option value="">Select Variant</option>
              {formData.productId && products.find(p => p.id === parseInt(formData.productId))?.variants.map((v, i) => (
                <option key={i} value={v.weight}>{v.weight}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-text mb-1 text-sm">Stock In</label>
              <input
                type="number"
                min="0"
                value={formData.stockIn}
                onChange={(e) => setFormData({ ...formData, stockIn: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1 text-sm">Stock Out</label>
              <input
                type="number"
                min="0"
                value={formData.stockOut}
                onChange={(e) => setFormData({ ...formData, stockOut: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-text mb-1 text-sm">
              Returned <span className="text-xs font-normal text-text-light">(Optional)</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.returned}
              onChange={(e) => setFormData({ ...formData, returned: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-semibold text-text mb-1 text-sm">Note <span className="text-xs font-normal text-text-light">(Optional)</span></label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Any additional notes..."
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="bg-warning/10 p-3 rounded-xl border border-warning">
            <p className="text-xs text-warning">
              <i className="fas fa-info-circle mr-1"></i>
              This stock entry does NOT update product stock. It's for tracking stock movements only.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-primary flex-1">
              <i className="fas fa-save"></i> {editingEntry ? 'Update' : 'Add'} Entry
            </button>
          </div>
        </div>
      </PopupModal>

      <Footer isAdmin />
    </div>
  );
}