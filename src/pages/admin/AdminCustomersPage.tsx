import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, X } from 'lucide-react';
import { Order, Address } from '../../types/index.ts';
import { apiRequest } from '../../services/api.ts';
import { useToast } from '../../hooks/useToast.tsx';

interface AdminCustomerRow {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_active: number;
  created_at: string;
  total_orders: number;
  lifetime_spend: number;
  addresses: Address[];
  orders: Order[];
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerRow | null>(null);
  const { showToast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ customers: AdminCustomerRow[] }>(
        `/api/admin/customers?search=${encodeURIComponent(search)}`
      );
      setCustomers(res.customers || []);
    } catch (err: any) {
      showToast('Failed to load customers', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Customer Directory & Order History</h1>
        <p className="text-xs text-stone-500 mt-1">
          Query customer records from <code>users</code>, <code>addresses</code>, and{' '}
          <code>GetCustomerOrderHistory</code>.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name, email, or phone..."
          className="w-full pl-10 pr-4 py-2 text-xs border border-stone-300 rounded-xl bg-white"
        />
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <th className="py-3 px-4 font-semibold">ID</th>
              <th className="py-3 px-4 font-semibold">Customer Name</th>
              <th className="py-3 px-4 font-semibold">Email & Phone</th>
              <th className="py-3 px-4 font-semibold">Saved Addresses</th>
              <th className="py-3 px-4 font-semibold">Total Orders</th>
              <th className="py-3 px-4 font-semibold text-right">Lifetime Spend</th>
              <th className="py-3 px-4 font-semibold text-right">Order History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stone-400">
                  Loading customers...
                </td>
              </tr>
            ) : (
              customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-stone-50">
                  <td className="py-3 px-4 font-mono text-stone-500">#{cust.id}</td>
                  <td className="py-3 px-4 font-bold text-stone-900">{cust.full_name}</td>
                  <td className="py-3 px-4 font-mono">
                    <div className="text-stone-800">{cust.email}</div>
                    <div className="text-[11px] text-stone-500">{cust.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {cust.addresses.length > 0
                      ? `${cust.addresses[0].city}, ${cust.addresses[0].state} (${cust.addresses.length})`
                      : 'No address'}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                    {cust.total_orders}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-stone-900 text-right tabular-nums">
                    ₹{cust.lifetime_spend.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedCustomer(cust)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-orange-500 text-white text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Orders ({cust.total_orders})</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-3xl w-full p-6 shadow-xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Order History: {selectedCustomer.full_name}
                </h2>
                <p className="text-xs font-mono text-stone-500 mt-0.5">
                  {selectedCustomer.email} · {selectedCustomer.phone} · Lifetime Spend: ₹
                  {selectedCustomer.lifetime_spend.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {selectedCustomer.orders.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center">
                  This customer has not placed any orders yet.
                </p>
              ) : (
                selectedCustomer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-stone-900">
                        {ord.order_number} · {ord.order_status}
                      </span>
                      <span className="font-mono font-bold text-orange-600">
                        ₹{ord.final_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-stone-600">
                      {ord.items
                        .map(
                          (it) =>
                            `${it.quantity}x ${it.pizza_name_snapshot} (${it.size_name_snapshot})`
                        )
                        .join(', ')}
                    </div>
                    <div className="text-[11px] font-mono text-stone-500">
                      {new Date(ord.created_at).toLocaleString()} · {ord.payment_method} (
                      {ord.payment_status})
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
