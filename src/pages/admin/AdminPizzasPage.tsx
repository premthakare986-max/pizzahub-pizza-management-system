import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { Pizza, Category } from '../../types/index.ts';
import { apiRequest } from '../../services/api.ts';
import { PizzaImage } from '../../components/PizzaImage.tsx';
import { useToast } from '../../hooks/useToast.tsx';

const PRESET_IMAGES = [
  { label: 'Margherita Classica DOP', url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Farmhouse Harvest Crunch', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Quattro Formaggi Gold', url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Mediterranean Kalamata', url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Black Truffle & Wild Mushroom', url: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Genovese Pesto & Burrata', url: 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Caramelized Fig & Chicken', url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Garlic Confit & Rosemary Bianca', url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Fiery Peri-Peri Paneer', url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Calabrian Diavola Hot Honey', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Mexican Jalapeno Fiesta', url: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Smoky Tandoori Chicken Tikka', url: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Double Pepperoni Feast', url: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Hickory Smoked BBQ Chicken', url: 'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Sicilian Meat Lovers Supreme', url: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Roasted Garlic & Herb Chicken', url: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=85' },
];

export function AdminPizzasPage() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPizza, setEditingPizza] = useState<Pizza | null>(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [isVeg, setIsVeg] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState<'Mild' | 'Medium' | 'Hot'>('Mild');
  const [regPrice, setRegPrice] = useState('299');
  const [medPrice, setMedPrice] = useState('449');
  const [lrgPrice, setLrgPrice] = useState('599');
  const [isPopular, setIsPopular] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        apiRequest<{ pizzas: Pizza[] }>('/api/pizzas?includeUnavailable=true'),
        apiRequest<{ categories: Category[] }>('/api/categories'),
      ]);
      setPizzas(pRes.pizzas || []);
      setCategories(cRes.categories || []);
    } catch (err: any) {
      showToast('Failed to load pizzas', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const openAddModal = () => {
    setEditingPizza(null);
    setName('');
    setCategoryId(categories[0]?.id || 1);
    setDescription('');
    setImageUrl(PRESET_IMAGES[0].url);
    setIsVeg(true);
    setSpiceLevel('Mild');
    setRegPrice('349');
    setMedPrice('499');
    setLrgPrice('649');
    setIsPopular(true);
    setIsBestSeller(false);
    setIsAvailable(true);
    setModalOpen(true);
  };

  const openEditModal = (pizza: Pizza) => {
    setEditingPizza(pizza);
    setName(pizza.name);
    setCategoryId(pizza.category_id);
    setDescription(pizza.description);
    setImageUrl(pizza.image_url);
    setIsVeg(pizza.is_veg === 1);
    setSpiceLevel(pizza.spice_level);
    const reg = pizza.sizes.find((s) => s.size_name === 'Regular')?.price || pizza.base_price;
    const med = pizza.sizes.find((s) => s.size_name === 'Medium')?.price || pizza.base_price + 150;
    const lrg = pizza.sizes.find((s) => s.size_name === 'Large')?.price || pizza.base_price + 300;
    setRegPrice(String(reg));
    setMedPrice(String(med));
    setLrgPrice(String(lrg));
    setIsPopular(pizza.is_popular === 1);
    setIsBestSeller(pizza.is_best_seller === 1);
    setIsAvailable(pizza.is_available === 1);
    setModalOpen(true);
  };

  const handleSavePizza = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        category_id: categoryId,
        name,
        description,
        image_url: imageUrl,
        is_veg: isVeg,
        spice_level: spiceLevel,
        regular_price: Number(regPrice),
        medium_price: Number(medPrice),
        large_price: Number(lrgPrice),
        is_popular: isPopular,
        is_best_seller: isBestSeller,
        is_available: isAvailable,
      };

      if (editingPizza) {
        await apiRequest(`/api/pizzas/${editingPizza.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast(`Updated ${name}`, 'success');
      } else {
        await apiRequest('/api/pizzas', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast(`Created ${name} via AddNewPizza procedure`, 'success');
      }

      setModalOpen(false);
      await fetchCatalog();
    } catch (err: any) {
      showToast('Failed to save pizza', 'error', err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePizza = async (pizza: Pizza) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/pizzas/${pizza.id}`, {
        method: 'DELETE',
      });
      showToast('Pizza Action Completed', 'info', res.message);
      await fetchCatalog();
    } catch (err: any) {
      showToast('Delete Failed', 'error', err?.message);
    }
  };

  const filtered = pizzas.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Pizza Catalog Management</h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage <code>pizzas</code> and <code>pizza_sizes</code> (Regular, Medium, Large) via{' '}
            <code>AddNewPizza</code> stored procedure.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Pizza</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pizzas by name or category..."
          className="w-full pl-10 pr-4 py-2 text-xs border border-stone-300 rounded-xl bg-white"
        />
      </div>

      {/* Pizzas Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="py-3 px-4 font-semibold">Pizza</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold">Dietary</th>
                <th className="py-3 px-3 font-semibold">Regular / Medium / Large</th>
                <th className="py-3 px-3 font-semibold">Availability</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Loading pizzas...
                  </td>
                </tr>
              ) : (
                filtered.map((pizza) => (
                  <tr key={pizza.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-stone-900 shrink-0">
                          <PizzaImage
                            src={pizza.image_url}
                            alt={pizza.name}
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{pizza.name}</div>
                          <div className="text-[11px] text-stone-500 line-clamp-1 max-w-xs">
                            {pizza.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-700">{pizza.category_name}</td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          pizza.is_veg
                            ? 'text-emerald-700 font-semibold'
                            : 'text-red-700 font-semibold'
                        }
                      >
                        {pizza.is_veg ? 'Veg' : 'Non-Veg'}
                      </span>
                      <span className="text-stone-400 mx-1">·</span>
                      <span className="text-stone-500">{pizza.spice_level}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-stone-900 tabular-nums">
                      {pizza.sizes.map((s) => `₹${s.price}`).join(' / ')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          pizza.is_available
                            ? 'text-emerald-700 font-semibold'
                            : 'text-stone-400 font-medium'
                        }
                      >
                        {pizza.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(pizza)}
                        className="p-1.5 text-stone-600 hover:text-orange-600 rounded-lg hover:bg-stone-100"
                        title="Edit Pizza"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePizza(pizza)}
                        className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg hover:bg-stone-100"
                        title="Delete Pizza"
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
      </div>

      {/* Add / Edit Pizza Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 className="text-lg font-bold text-stone-900">
                {editingPizza ? `Edit Pizza #${editingPizza.id}` : 'Add New Pizza (AddNewPizza)'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePizza} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pizza Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Neapolitan Burrata Supreme"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe ingredients, crust, and cheese..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Regular (8") Price ₹
                  </label>
                  <input
                    type="number"
                    required
                    value={regPrice}
                    onChange={(e) => setRegPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Medium (10") Price ₹
                  </label>
                  <input
                    type="number"
                    required
                    value={medPrice}
                    onChange={(e) => setMedPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Large (12") Price ₹
                  </label>
                  <input
                    type="number"
                    required
                    value={lrgPrice}
                    onChange={(e) => setLrgPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pizza Artwork</label>
                  <select
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                  >
                    {PRESET_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Spice Level</label>
                  <select
                    value={spiceLevel}
                    onChange={(e) => setSpiceLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Medium">Medium</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVeg}
                    onChange={(e) => setIsVeg(e.target.checked)}
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                  />
                  <span>Popular on Home</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                  />
                  <span>Best Seller</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                  />
                  <span>Available for Ordering</span>
                </label>
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
                  {saving ? 'Saving...' : editingPizza ? 'Update Pizza' : 'Create Pizza'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
