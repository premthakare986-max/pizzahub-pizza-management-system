import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, ShoppingBag, Flame, Clock, Check } from 'lucide-react';
import { Pizza, PizzaSize, Topping } from '../types/index.ts';
import { PizzaImage } from './PizzaImage.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useToast } from '../hooks/useToast.tsx';

interface PizzaCustomizeModalProps {
  pizza: Pizza | null;
  allToppings: Topping[];
  onClose: () => void;
}

export function PizzaCustomizeModal({
  pizza,
  allToppings,
  onClose,
}: PizzaCustomizeModalProps) {
  if (!pizza) return null;

  const mediumOrFirst =
    pizza.sizes.find((s) => s.size_name === 'Medium') || pizza.sizes[0];
  const [selectedSize, setSelectedSize] = useState<PizzaSize>(mediumOrFirst);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  const { addToCart } = useCart();
  const { showToast } = useToast();

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) =>
      prev.some((t) => t.id === topping.id)
        ? prev.filter((t) => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  const toppingsTotal = useMemo(
    () => selectedToppings.reduce((sum, t) => sum + t.price, 0),
    [selectedToppings]
  );

  const totalItemPrice = useMemo(
    () => Number(((selectedSize.price + toppingsTotal) * quantity).toFixed(2)),
    [selectedSize, toppingsTotal, quantity]
  );

  const handleConfirmAdd = () => {
    addToCart(pizza, selectedSize, selectedToppings, quantity);
    showToast(
      `Added ${quantity}x ${pizza.name} (${selectedSize.size_name})`,
      'success',
      selectedToppings.length > 0
        ? `With ${selectedToppings.map((t) => t.name).join(', ')}`
        : 'Added to your shopping bag.'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header / Hero Split */}
        <div className="grid grid-cols-1 md:grid-cols-5 bg-stone-950 text-white">
          <div className="md:col-span-2 relative h-52 md:h-auto">
            <PizzaImage src={pizza.image_url} alt={pizza.name} className="w-full h-full" />
          </div>
          <div className="md:col-span-3 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="text-xs text-stone-400">
                  <span>{pizza.category_name}</span>
                  <span className="mx-1.5">·</span>
                  <span className={pizza.is_veg ? 'text-emerald-400' : 'text-red-400'}>
                    {pizza.is_veg ? '100% Vegetarian' : 'Non-Vegetarian'}
                  </span>
                  <span className="mx-1.5">·</span>
                  <span>{pizza.spice_level} Spice</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1.5">{pizza.name}</h2>
              <p className="text-sm text-stone-300 mt-2 leading-relaxed">{pizza.description}</p>
            </div>

            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-stone-800 text-xs text-stone-400 font-mono">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                {pizza.prep_time_mins} mins bake
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                {pizza.calories} kcal
              </span>
              <span>SKU #{pizza.id}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Select Pizza Size */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-900">
                1. Select Crust Size (pizza_sizes table)
              </h3>
              <span className="text-xs text-stone-500">Required · Choose 1</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pizza.sizes.map((sz) => {
                const active = selectedSize.id === sz.id;
                return (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-orange-500 bg-orange-50/70 ring-1 ring-orange-500'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-900">{sz.size_name}</span>
                      <span className="text-xs font-mono text-stone-500">
                        {sz.diameter_inches}" ({sz.size_code})
                      </span>
                    </div>
                    <div className="text-base font-bold font-mono text-orange-600 mt-1.5">
                      ₹{sz.price.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Extra Custom Toppings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-900">
                2. Add Extra Artisanal Toppings (toppings table)
              </h3>
              <span className="text-xs text-stone-500">
                Optional · {selectedToppings.length} selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allToppings.map((top) => {
                const checked = selectedToppings.some((t) => t.id === top.id);
                return (
                  <button
                    key={top.id}
                    type="button"
                    onClick={() => toggleTopping(top)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      checked
                        ? 'border-orange-500 bg-orange-50/50'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          checked
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-stone-900 truncate">
                          {top.name}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {top.category} · {top.is_veg ? 'Veg' : 'Non-Veg'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-stone-800 ml-2 shrink-0">
                      +₹{top.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Kitchen Recipe Bill of Materials Info */}
          {pizza.recipe && pizza.recipe.length > 0 && (
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-xs font-semibold text-stone-700 mb-1">
                Kitchen Recipe Ingredients (pizza_ingredients BOM — auto-deducted on checkout)
              </div>
              <div className="text-xs text-stone-500 font-mono">
                {pizza.recipe
                  .map((r) => `${r.ingredient_name} (${r.quantity_required} ${r.unit})`)
                  .join(' · ')}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 sm:px-6 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-stone-600">Quantity</span>
            <div className="inline-flex items-center border border-stone-300 rounded-lg bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 text-stone-600 hover:text-stone-900"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-bold font-mono text-stone-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2 text-stone-600 hover:text-stone-900"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmAdd}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
            <span className="font-mono font-bold">₹{totalItemPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
