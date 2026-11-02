import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingBag, RotateCcw } from 'lucide-react';
import { Pizza, Category, Topping } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { PizzaImage } from '../components/PizzaImage.tsx';
import { PizzaCustomizeModal } from '../components/PizzaCustomizeModal.tsx';
import { useToast } from '../hooks/useToast.tsx';

export function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'calories_asc'>('default');
  const [customizingPizza, setCustomizingPizza] = useState<Pizza | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      apiRequest<{ pizzas: Pizza[]; toppings: Topping[] }>('/api/pizzas'),
      apiRequest<{ categories: Category[] }>('/api/categories'),
    ])
      .then(([pizzaRes, catRes]) => {
        setPizzas(pizzaRes.pizzas || []);
        setToppings(pizzaRes.toppings || []);
        setCategories(catRes.categories || []);
      })
      .catch((err) => {
        showToast('Failed to load pizzas from database', 'error', err?.message);
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const filteredPizzas = useMemo(() => {
    let result = [...pizzas];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(
        (p) =>
          p.category_slug === selectedCategory || String(p.category_id) === selectedCategory
      );
    }

    if (dietFilter === 'veg') {
      result = result.filter((p) => p.is_veg === 1);
    } else if (dietFilter === 'non-veg') {
      result = result.filter((p) => p.is_veg === 0);
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.base_price - b.base_price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.base_price - a.base_price);
    } else if (sortBy === 'calories_asc') {
      result.sort((a, b) => a.calories - b.calories);
    }

    return result;
  }, [pizzas, searchQuery, selectedCategory, dietFilter, sortBy]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setDietFilter('all');
    setSortBy('default');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="text-xs font-medium text-orange-600">Wood-Fired Menu Catalog</div>
          <h1 className="text-3xl font-bold text-stone-900 mt-1">
            Crafted Pizzas & Custom Toppings
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Select any pizza to choose Regular (8"), Medium (10"), or Large (12") size and custom
            toppings.
          </p>
        </div>
        <div className="text-xs font-mono text-stone-500">
          Showing {filteredPizzas.length} of {pizzas.length} pizzas
        </div>
      </div>

      {/* Interactive Filter Controls Bar */}
      <div className="mt-6 bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pizzas by name, truffle, paneer, pepperoni..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Dietary Segmented Control (Veg / Non-Veg) */}
          <div className="md:col-span-4 flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setDietFilter('all')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                dietFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({pizzas.length})
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('veg')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                dietFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pure Veg
            </button>
            <button
              type="button"
              onClick={() => setDietFilter('non-veg')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                dietFilter === 'non-veg'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Non-Veg
            </button>
          </div>

          {/* Price Sorting Select */}
          <div className="md:col-span-3 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-stone-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium border border-stone-300 rounded-xl bg-white focus:outline-none focus:border-orange-500"
            >
              <option value="default">Sort: Featured Order</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="calories_asc">Calories: Low to High</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat.slug
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-96 rounded-2xl bg-white border border-stone-200 animate-pulse"
            />
          ))}
        </div>
      ) : filteredPizzas.length === 0 ? (
        <div className="mt-12 bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <h3 className="text-lg font-bold text-stone-900">No Matching Pizzas Found</h3>
          <p className="text-sm text-stone-600 mt-1">
            No pizzas matched your current search and dietary filter criteria.
          </p>
          <button
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredPizzas.map((pizza) => (
            <div
              key={pizza.id}
              className="group bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 shadow-2xs"
            >
              <div>
                <div
                  onClick={() => setCustomizingPizza(pizza)}
                  className="relative aspect-[4/3] w-full overflow-hidden cursor-pointer bg-stone-900"
                >
                  <PizzaImage
                    src={pizza.image_url}
                    alt={pizza.name}
                    pizzaId={pizza.id}
                    pizzaSlug={pizza.slug}
                    pizzaName={pizza.name}
                    lazy={true}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold ${
                        pizza.is_veg ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          pizza.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                      />
                      {pizza.is_veg ? 'Pure Veg' : 'Non-Veg'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{pizza.category_name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{pizza.spice_level} Spice</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{pizza.calories} kcal</span>
                  </div>

                  <h3
                    onClick={() => setCustomizingPizza(pizza)}
                    className="text-lg font-bold text-stone-900 mt-1.5 cursor-pointer hover:text-orange-600 transition-colors"
                  >
                    {pizza.name}
                  </h3>

                  <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                    {pizza.description}
                  </p>

                  {/* Size price preview row */}
                  <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-center">
                    {pizza.sizes.map((sz) => (
                      <div
                        key={sz.id}
                        onClick={() => setCustomizingPizza(pizza)}
                        className="p-1.5 rounded-lg bg-stone-50 hover:bg-orange-50 cursor-pointer transition-colors"
                      >
                        <div className="text-[11px] text-stone-500">{sz.size_name}</div>
                        <div className="text-xs font-bold font-mono text-stone-900 tabular-nums">
                          ₹{sz.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-stone-400">Starting at (Regular 8")</span>
                  <span className="text-base font-bold font-mono text-stone-900 tabular-nums">
                    ₹{pizza.base_price.toFixed(0)} onwards
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCustomizingPizza(pizza)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-300 hover:border-orange-500 hover:text-orange-600 text-stone-800 text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Select Size</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomizingPizza(pizza)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Customize & Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PizzaCustomizeModal
        pizza={customizingPizza}
        allToppings={toppings}
        onClose={() => setCustomizingPizza(null)}
      />
    </div>
  );
}
