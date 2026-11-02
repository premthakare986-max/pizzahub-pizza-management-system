import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Category } from '../../types/index.ts';
import { apiRequest } from '../../services/api.ts';
import { useToast } from '../../hooks/useToast.tsx';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ categories: Category[] }>('/api/categories');
      setCategories(res.categories || []);
    } catch (err: any) {
      showToast('Failed to load categories', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAdd = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setDisplayOrder(String(categories.length + 1));
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description);
    setDisplayOrder(String(cat.display_order));
    setIsActive(cat.is_active === 1);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        display_order: Number(displayOrder),
        is_active: isActive,
      };
      if (editingCat) {
        await apiRequest(`/api/categories/${editingCat.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Category updated', 'success');
      } else {
        await apiRequest('/api/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Category created', 'success');
      }
      setModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      showToast('Failed to save category', 'error', err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    try {
      await apiRequest(`/api/categories/${cat.id}`, { method: 'DELETE' });
      showToast('Category deleted', 'info');
      await fetchCategories();
    } catch (err: any) {
      showToast('Foreign Key Constraint Protected', 'error', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Category Management</h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage <code>categories</code> table with foreign key integrity (
            <code>fk_pizzas_category</code>).
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <th className="py-3 px-4 font-semibold">Order</th>
              <th className="py-3 px-4 font-semibold">Category Name</th>
              <th className="py-3 px-4 font-semibold">Slug</th>
              <th className="py-3 px-4 font-semibold">Description</th>
              <th className="py-3 px-4 font-semibold">Linked Pizzas</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-stone-400">
                  Loading categories...
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-stone-50">
                  <td className="py-3 px-4 font-mono text-stone-500">#{cat.display_order}</td>
                  <td className="py-3 px-4 font-bold text-stone-900">{cat.name}</td>
                  <td className="py-3 px-4 font-mono text-stone-500">{cat.slug}</td>
                  <td className="py-3 px-4 text-stone-600 max-w-md">{cat.description}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                    {cat.pizza_count || 0} pizzas
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 text-stone-600 hover:text-orange-600 rounded-lg hover:bg-stone-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg hover:bg-stone-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 className="text-lg font-bold text-stone-900">
                {editingCat ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Neapolitan Classics"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
