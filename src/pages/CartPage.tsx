import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { PizzaImage } from '../components/PizzaImage.tsx';
import { useToast } from '../hooks/useToast.tsx';

export function CartPage() {
  const {
    items,
    couponCode,
    subtotal,
    taxAmount,
    deliveryFee,
    discountAmount,
    finalAmount,
    totalItemsCount,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();

  const [couponInput, setCouponInput] = useState(couponCode || '');
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    showToast(res.message, res.valid ? 'success' : 'error');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white border border-stone-200 rounded-2xl p-12 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Your Pizza Bag is Empty</h1>
          <p className="text-sm text-stone-600 mt-2">
            Explore our wood-fired menu and customize your pizza crust size and toppings.
          </p>
          <Link
            to="/menu"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
          >
            <span>Browse Pizza Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Shopping Cart</h1>
          <p className="text-sm text-stone-600 mt-1">
            {totalItemsCount} pizza(s) customized and ready for stone-oven baking.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-medium text-stone-500 hover:text-red-600 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
        {/* Left Itemized List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.cartItemId}
              className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-stone-900 shrink-0">
                  <PizzaImage
                    src={item.pizza.image_url}
                    alt={item.pizza.name}
                    className="w-full h-full"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-stone-500">
                    <span
                      className={
                        item.pizza.is_veg
                          ? 'text-emerald-700 font-semibold'
                          : 'text-red-700 font-semibold'
                      }
                    >
                      {item.pizza.is_veg ? 'Veg' : 'Non-Veg'}
                    </span>
                    <span className="mx-1.5">·</span>
                    <span>
                      {item.selectedSize.size_name} ({item.selectedSize.diameter_inches}")
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mt-0.5">{item.pizza.name}</h3>

                  {item.selectedToppings.length > 0 ? (
                    <p className="text-xs text-stone-600 mt-1">
                      + Extra Toppings:{' '}
                      {item.selectedToppings.map((t) => `${t.name} (₹${t.price})`).join(', ')}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-400 mt-1">Standard chef toppings</p>
                  )}

                  <div className="text-xs font-mono text-stone-500 mt-1.5">
                    Base ₹{item.unitBasePrice}
                    {item.toppingsUnitPrice > 0 && ` + Toppings ₹${item.toppingsUnitPrice}`} = ₹
                    {item.unitBasePrice + item.toppingsUnitPrice} / pizza
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="inline-flex items-center border border-stone-300 rounded-lg bg-stone-50">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.cartItemId, -1)}
                    className="p-2 text-stone-600 hover:text-stone-900"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono text-stone-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.cartItemId, 1)}
                    className="p-2 text-stone-600 hover:text-stone-900"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[85px]">
                  <div className="text-base font-bold font-mono text-stone-900 tabular-nums">
                    ₹{item.lineTotal.toFixed(2)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Bill Summary & Coupon Box */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-stone-900">Order Bill Summary</h2>

          {/* Promo Code Input */}
          <form onSubmit={handleApplyCoupon} className="space-y-2">
            <label className="block text-xs font-medium text-stone-600">
              Promotional Coupon (WELCOME100, FEAST150, PIZZA20)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-stone-300 rounded-lg uppercase focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
              >
                Apply
              </button>
            </div>
            {couponCode && (
              <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                <span className="font-mono font-semibold">{couponCode} applied</span>
                <button
                  type="button"
                  onClick={() => {
                    removeCoupon();
                    setCouponInput('');
                  }}
                  className="text-emerald-800 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </form>

          {/* Itemized Financial Breakdown */}
          <div className="space-y-2.5 pt-4 border-t border-stone-200 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Items Subtotal</span>
              <span className="font-mono tabular-nums">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>GST & Restaurant Taxes (5%)</span>
              <span className="font-mono tabular-nums">₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Delivery Fee {subtotal >= 500 && '(Free above ₹500)'}</span>
              <span className="font-mono tabular-nums">
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Coupon Discount ({couponCode})</span>
                <span className="font-mono tabular-nums">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-stone-200 flex justify-between text-base font-bold text-stone-900">
              <span>Final Payable Amount</span>
              <span className="font-mono text-orange-600 tabular-nums">
                ₹{finalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
