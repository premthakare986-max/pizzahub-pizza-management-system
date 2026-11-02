import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { apiRequest } from '../services/api.ts';
import { Order, DBHealthResponse } from '../types/index.ts';
import { useToast } from '../hooks/useToast.tsx';

export function CheckoutPage() {
  const { user, login, addAddress } = useAuth();
  const {
    items,
    couponCode,
    subtotal,
    taxAmount,
    deliveryFee,
    discountAmount,
    finalAmount,
    clearCart,
  } = useCart();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [customStreet, setCustomStreet] = useState('');
  const [customCity, setCustomCity] = useState('Mumbai');
  const [customState, setCustomState] = useState('Maharashtra');
  const [customPostal, setCustomPostal] = useState('400050');
  const [contactPhone, setContactPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Online' | 'COD'>('Online');
  const [paymentGateway, setPaymentGateway] = useState('Razorpay_UPI');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [dbHealth, setDbHealth] = useState<DBHealthResponse | null>(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    apiRequest<DBHealthResponse>('/api/health')
      .then(setDbHealth)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setContactPhone(user.phone || '+91-9876543210');
      if (user.addresses && user.addresses.length > 0) {
        const def = user.addresses.find((a) => a.is_default === 1) || user.addresses[0];
        setSelectedAddressId(def.id);
      } else {
        setShowNewAddressForm(true);
      }
    }
  }, [user]);

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStreet.trim()) return;
    try {
      await addAddress({
        label: 'Delivery',
        recipient_name: user?.full_name || 'Customer',
        phone: contactPhone,
        street_address: customStreet,
        landmark: null,
        city: customCity,
        state: customState,
        postal_code: customPostal,
        is_default: 1,
      });
      setShowNewAddressForm(false);
      showToast('Delivery address saved to MySQL addresses table', 'success');
    } catch (err: any) {
      showToast('Failed to save address', 'error', err?.message);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to place your order', 'error');
      navigate('/auth?redirect=/checkout');
      return;
    }

    const selectedAddrObj = user.addresses?.find((a) => a.id === selectedAddressId);
    const addressSnapshot = selectedAddrObj
      ? `${selectedAddrObj.street_address}, ${selectedAddrObj.city}, ${selectedAddrObj.state} ${selectedAddrObj.postal_code}`
      : `${customStreet}, ${customCity}, ${customState} ${customPostal}`.trim();

    if (!addressSnapshot || addressSnapshot.length < 8) {
      showToast('Please select or enter a valid delivery address', 'error');
      return;
    }

    setPlacingOrder(true);
    try {
      const payload = {
        address_id: selectedAddressId,
        delivery_address: addressSnapshot,
        customer_phone: contactPhone || user.phone,
        payment_method: paymentMethod,
        payment_gateway: paymentMethod === 'Online' ? paymentGateway : 'Cash_On_Delivery',
        coupon_code: couponCode,
        special_instructions: specialInstructions,
        items: items.map((item) => ({
          pizza_id: item.pizza.id,
          pizza_size_id: item.selectedSize.id,
          size_name: item.selectedSize.size_name,
          quantity: item.quantity,
          topping_ids: item.selectedToppings.map((t) => t.id),
        })),
      };

      const res = await apiRequest<{ success: boolean; order: Order; message: string }>(
        '/api/orders',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      setConfirmedOrder(res.order);
      clearCart();
      showToast(`Order ${res.order.order_number} Placed!`, 'success', res.message);
    } catch (err: any) {
      showToast('Checkout Failed', 'error', err?.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  // Post-Order Confirmation View
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="text-xs font-mono text-emerald-700 font-semibold">
            ACID TRANSACTION COMMITTED · STOCK DEDUCTED
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Order #{confirmedOrder.order_number} Confirmed!
          </h1>
          <p className="text-sm text-stone-600 mt-2">
            Your order has been saved to the <code>orders</code>, <code>order_items</code>, and{' '}
            <code>payments</code> tables, and kitchen ingredients were automatically deducted via{' '}
            <code>trg_after_order_item_insert_deduct_stock</code>.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-stone-500">Order Number</div>
              <div className="font-mono font-bold text-stone-900 mt-0.5">
                {confirmedOrder.order_number}
              </div>
            </div>
            <div>
              <div className="text-stone-500">Order Status</div>
              <div className="font-semibold text-orange-600 mt-0.5">
                {confirmedOrder.order_status}
              </div>
            </div>
            <div>
              <div className="text-stone-500">Payment Method</div>
              <div className="font-mono text-stone-900 mt-0.5">
                {confirmedOrder.payment_method} ({confirmedOrder.payment_status})
              </div>
            </div>
            <div>
              <div className="text-stone-500">Total Amount</div>
              <div className="font-mono font-bold text-stone-900 mt-0.5">
                ₹{confirmedOrder.final_amount.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/orders"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors inline-flex items-center gap-2"
            >
              <span>Track Order in My Orders</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/menu"
              className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors"
            >
              Continue Browsing Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-stone-900">No Items to Checkout</h2>
          <p className="text-sm text-stone-600 mt-1">Add pizzas to your cart first.</p>
          <Link
            to="/menu"
            className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-semibold"
          >
            Go to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-stone-200">
        <div className="text-xs font-medium text-orange-600">Secure Order Placement</div>
        <h1 className="text-3xl font-bold text-stone-900 mt-1">Checkout & Payment</h1>
      </div>

      {dbHealth && !dbHealth.mysql.connected && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <div className="font-bold text-sm text-amber-900">
              MySQL 8 Database Status: NOT CONNECTED ({dbHealth.mysql.error_code || 'DB_SETUP_REQUIRED'})
            </div>
            <p className="mt-1">
              Your backend MySQL 8 connection is not active yet. While you can browse all 16 pizzas,
              customize sizes/toppings, and test the cart calculator, orders will{' '}
              <strong>not</strong> be falsely claimed as saved until you configure{' '}
              <code>DB_HOST</code>, <code>DB_PORT</code>, <code>DB_USER</code>,{' '}
              <code>DB_PASSWORD</code>, and <code>DB_NAME</code> in your backend <code>.env</code>{' '}
              file and click <strong>Retry Connection</strong> in the top bar.
            </p>
          </div>
        </div>
      )}

      {!user ? (
        <div className="mt-8 bg-white border border-stone-200 rounded-2xl p-8 max-w-xl">
          <h2 className="text-lg font-bold text-stone-900">Sign In Required to Place Order</h2>
          <p className="text-sm text-stone-600 mt-1">
            Orders are linked to your customer record in <code>users</code> via foreign key{' '}
            <code>fk_orders_user</code>.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                await login('aarav@example.com', 'Customer@123');
                showToast('Signed in as Aarav Sharma', 'success');
              }}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold"
            >
              1-Click Sign In as Demo Customer (Aarav)
            </button>
            <Link
              to="/auth?redirect=/checkout"
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold"
            >
              Sign In or Register New Account
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Left Column: Address & Payment Method */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Delivery Address */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <h2 className="text-base font-bold text-stone-900">
                    1. Select Delivery Address
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm((v) => !v)}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showNewAddressForm ? 'Cancel' : 'Add New Address'}</span>
                </button>
              </div>

              {user.addresses && user.addresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {user.addresses.map((addr) => {
                    const active = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          active
                            ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                          <span>{addr.label}</span>
                          <span className="font-mono text-stone-500">{addr.postal_code}</span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                          {addr.street_address}, {addr.city}, {addr.state}
                        </p>
                        <div className="text-[11px] font-mono text-stone-500 mt-2">
                          Phone: {addr.phone}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showNewAddressForm && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 mb-4">
                  <div className="text-xs font-bold text-stone-800">Add New Delivery Address</div>
                  <input
                    type="text"
                    value={customStreet}
                    onChange={(e) => setCustomStreet(e.target.value)}
                    placeholder="Flat No, Building, Street Address *"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="City"
                      className="px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      value={customState}
                      onChange={(e) => setCustomState(e.target.value)}
                      placeholder="State"
                      className="px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      value={customPostal}
                      onChange={(e) => setCustomPostal(e.target.value)}
                      placeholder="Postal Code"
                      className="px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveNewAddress}
                    className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold"
                  >
                    Save Address
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Special Kitchen / Delivery Instructions
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g., Extra crispy crust, ring bell once"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Mode (Online vs Cash on Delivery) */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-base font-bold text-stone-900 mb-4">
                2. Select Payment Method (payments table)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Online')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    paymentMethod === 'Online'
                      ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    <span>Instant Online Payment</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    Simulated UPI, Credit/Debit Card, or NetBanking with instant confirmation.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                    <Banknote className="w-4 h-4 text-orange-500" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    Pay in cash or UPI at your doorstep when your pizza arrives hot.
                  </p>
                </button>
              </div>

              {paymentMethod === 'Online' && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <label className="block text-xs font-medium text-stone-700 mb-2">
                    Select Simulated Payment Gateway Channel
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'Razorpay_UPI', label: 'UPI (GPay / PhonePe)' },
                      { id: 'Razorpay_Card', label: 'Visa / Mastercard' },
                      { id: 'Razorpay_NetBanking', label: 'NetBanking' },
                    ].map((gw) => (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setPaymentGateway(gw.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          paymentGateway === gw.id
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {gw.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Submit */}
          <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 space-y-5 h-fit">
            <h2 className="text-lg font-bold text-stone-900">Order Receipt Preview</h2>

            <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.cartItemId} className="py-3 flex justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-stone-900">
                      {item.quantity}x {item.pizza.name} ({item.selectedSize.size_name})
                    </div>
                    {item.selectedToppings.length > 0 && (
                      <div className="text-stone-500 mt-0.5">
                        + {item.selectedToppings.map((t) => t.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="font-mono font-semibold text-stone-900 shrink-0 tabular-nums">
                    ₹{item.lineTotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-stone-200 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST (5%)</span>
                <span className="font-mono tabular-nums">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Fee</span>
                <span className="font-mono tabular-nums">
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({couponCode})</span>
                  <span className="font-mono tabular-nums">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-stone-200 flex justify-between text-base font-bold text-stone-900">
                <span>Total Amount</span>
                <span className="font-mono text-orange-600 tabular-nums">
                  ₹{finalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={placingOrder}
              className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {placingOrder
                  ? 'Executing MySQL Transaction...'
                  : `Place Order · ₹${finalAmount.toFixed(2)}`}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
