import React, { useState, useEffect } from 'react';
import { Payment } from '../../types/index.ts';
import { apiRequest } from '../../services/api.ts';
import { useToast } from '../../hooks/useToast.tsx';

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState<'all' | 'Online' | 'COD'>('all');
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest<{ payments: Payment[] }>('/api/admin/payments')
      .then((res) => setPayments(res.payments || []))
      .catch((err) => showToast('Failed to load payments', 'error', err?.message))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filtered = payments.filter((p) =>
    filterMethod === 'all' ? true : p.payment_method === filterMethod
  );

  const completedSum = filtered
    .filter((p) => p.payment_status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Payment Gateway Ledger</h1>
          <p className="text-xs text-stone-500 mt-1">
            Reconcile online and Cash-on-Delivery records from the <code>payments</code> table.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'Online', 'COD'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMethod(m)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                filterMethod === m
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600'
              }`}
            >
              {m === 'all' ? 'All Methods' : m}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between text-xs">
        <span className="text-stone-600">
          Showing <strong>{filtered.length}</strong> payment records
        </span>
        <span className="font-mono font-bold text-stone-900">
          Completed Volume: ₹{completedSum.toFixed(2)}
        </span>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <th className="py-3 px-4 font-semibold">Transaction Ref</th>
                <th className="py-3 px-3 font-semibold">Order #</th>
                <th className="py-3 px-3 font-semibold">Customer</th>
                <th className="py-3 px-3 font-semibold">Method & Gateway</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Paid At</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Loading payment records...
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                      {pay.transaction_reference}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-700">{pay.order_number}</td>
                    <td className="py-3 px-3 text-stone-700">{pay.customer_name}</td>
                    <td className="py-3 px-3 font-mono text-stone-600">
                      {pay.payment_method} · {pay.payment_gateway}
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      <span
                        className={
                          pay.payment_status === 'Completed'
                            ? 'text-emerald-700'
                            : pay.payment_status === 'Pending'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }
                      >
                        {pay.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-500">
                      {pay.paid_at ? new Date(pay.paid_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900 text-right tabular-nums">
                      ₹{pay.amount.toFixed(2)}
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
