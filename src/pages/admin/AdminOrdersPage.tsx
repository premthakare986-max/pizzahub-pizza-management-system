import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.ts';
import { apiRequest } from '../../services/api.ts';
import { useToast } from '../../hooks/useToast.tsx';

const ALL_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ orders: Order[] }>(
        `/api/admin/orders?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(
          searchQuery
        )}`
      );
      setOrders(res.orders || []);
    } catch (err: any) {
      showToast('Failed to load orders', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await apiRequest<{ message: string }>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          reason: newStatus === 'Cancelled' ? 'Cancelled by Admin' : undefined,
        }),
      });
      showToast('Order Status Updated', 'success', res.message);
      await fetchOrders();
    } catch (err: any) {
      showToast('Failed to update status', 'error', err?.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Order Workflow Management</h1>
          <p className="text-xs text-stone-500 mt-1">
            Update order statuses via <code>UpdateOrderStatus</code> stored procedure (automatically
            syncs payments & reverses stock on cancellation).
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order # (PH-2026-1001), customer name, phone, city..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-stone-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            All Orders
          </button>
          {ALL_STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="py-3 px-4 font-semibold">Order # & Date</th>
                <th className="py-3 px-3 font-semibold">Customer & Address</th>
                <th className="py-3 px-3 font-semibold">Ordered Items</th>
                <th className="py-3 px-3 font-semibold">Payment</th>
                <th className="py-3 px-3 font-semibold text-right">Final Amount</th>
                <th className="py-3 px-4 font-semibold">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50 align-top">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-stone-900">{order.order_number}</div>
                      <div className="text-[11px] font-mono text-stone-500 mt-0.5">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="font-semibold text-stone-900">{order.customer_name}</div>
                      <div className="font-mono text-[11px] text-stone-500">
                        {order.customer_phone}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                        {order.delivery_address_snapshot}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        {order.items.map((it) => (
                          <div key={it.id} className="text-stone-800">
                            <span className="font-semibold">
                              {it.quantity}x {it.pizza_name_snapshot}
                            </span>{' '}
                            <span className="text-stone-500">({it.size_name_snapshot})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                      <div className="text-stone-900 font-semibold">{order.payment_method}</div>
                      <div className="text-[11px] text-stone-500">{order.payment_status}</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-stone-900 text-right whitespace-nowrap tabular-nums">
                      ₹{order.final_amount.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        disabled={updatingId === order.id}
                        value={order.order_status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-900 focus:outline-none focus:border-orange-500"
                      >
                        {ALL_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
