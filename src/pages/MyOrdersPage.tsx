import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, XCircle, Truck, ChefHat, RefreshCw } from 'lucide-react';
import { Order } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../hooks/useToast.tsx';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];

export function MyOrdersPage() {
  const { user, login } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<{ orders: Order[] }>('/api/orders/my');
      setOrders(res.orders || []);
    } catch (err: any) {
      showToast('Failed to fetch order history', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (order: Order) => {
    setCancellingId(order.id);
    try {
      const res = await apiRequest<{ message: string }>(`/api/orders/${order.id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Cancelled by customer from My Orders page' }),
      });
      showToast('Order Cancelled', 'info', res.message);
      await fetchOrders();
    } catch (err: any) {
      showToast('Cannot Cancel Order', 'error', err?.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-stone-200 rounded-2xl p-10">
          <h1 className="text-2xl font-bold text-stone-900">Sign In to View Your Orders</h1>
          <p className="text-sm text-stone-600 mt-2">
            View live order status tracking and historical receipts from{' '}
            <code>GetCustomerOrderHistory</code>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={async () => {
                await login('aarav@example.com', 'Customer@123');
                showToast('Signed in as Aarav Sharma', 'success');
              }}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold"
            >
              1-Click Sign In as Aarav (3 Sample Orders)
            </button>
            <Link
              to="/auth?redirect=/orders"
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold"
            >
              Go to Login Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between pb-6 border-b border-stone-200">
        <div>
          <div className="text-xs font-medium text-orange-600">
            Stored Procedure: GetCustomerOrderHistory({user.id})
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mt-1">My Orders & Live Tracking</h1>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 mt-8">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-52 rounded-2xl bg-white border border-stone-200 animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-10 bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <Package className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-stone-900">No Orders Placed Yet</h2>
          <p className="text-sm text-stone-600 mt-1">
            Order your first wood-fired pizza from the menu!
          </p>
          <Link
            to="/menu"
            className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-semibold"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-6 mt-8">
          {orders.map((order) => {
            const canCancel = ['Pending', 'Confirmed'].includes(order.order_status);
            const currentStepIdx = STATUS_STEPS.indexOf(order.order_status);

            return (
              <div
                key={order.id}
                className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                      <span className="font-bold text-stone-900 text-sm">
                        {order.order_number}
                      </span>
                      <span>·</span>
                      <span>{new Date(order.created_at).toLocaleString()}</span>
                      <span>·</span>
                      <span>
                        {order.payment_method} ({order.payment_status})
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Delivering to: {order.delivery_address_snapshot}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-stone-500">Total Amount</div>
                      <div className="text-lg font-bold font-mono text-stone-900 tabular-nums">
                        ₹{order.final_amount.toFixed(2)}
                      </div>
                    </div>

                    {canCancel && (
                      <button
                        type="button"
                        disabled={cancellingId === order.id}
                        onClick={() => handleCancelOrder(order)}
                        className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Live 5-Stage Status Progress Bar */}
                {order.order_status === 'Cancelled' ? (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-800">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      <strong>Order Cancelled:</strong>{' '}
                      {order.cancelled_reason || 'Cancelled and ingredient stock restored.'}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {STATUS_STEPS.map((step, idx) => {
                      const completed = idx <= currentStepIdx;
                      return (
                        <div key={step} className="text-center">
                          <div
                            className={`h-1.5 rounded-full mb-2 ${
                              completed ? 'bg-orange-500' : 'bg-stone-200'
                            }`}
                          />
                          <div
                            className={`text-[11px] font-medium ${
                              completed ? 'text-stone-900 font-semibold' : 'text-stone-400'
                            }`}
                          >
                            {step}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Order Line Items */}
                <div className="space-y-2 pt-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-stone-50"
                    >
                      <div>
                        <span className="font-bold text-stone-900">
                          {item.quantity}x {item.pizza_name_snapshot}
                        </span>
                        <span className="text-stone-500 ml-1.5">
                          ({item.size_name_snapshot})
                        </span>
                        {item.toppings && item.toppings.length > 0 && (
                          <span className="text-stone-500 ml-2">
                            · Toppings:{' '}
                            {item.toppings.map((t) => t.topping_name_snapshot).join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-stone-900 tabular-nums">
                        ₹{item.line_total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Receipt Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 text-xs text-stone-500 font-mono">
                  <span>
                    Subtotal: ₹{order.subtotal.toFixed(2)} · GST: ₹{order.tax_amount.toFixed(2)} ·
                    Delivery: ₹{order.delivery_fee.toFixed(2)}
                    {order.discount_amount > 0 &&
                      ` · Discount: -₹${order.discount_amount.toFixed(2)}`}
                  </span>
                  {order.payment && <span>Ref: {order.payment.transaction_reference}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
