import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../services/api.ts';
import { Ingredient, Order } from '../../types/index.ts';
import { useToast } from '../../hooks/useToast.tsx';

export function AdminDashboardPage() {
  const [data, setData] = useState<{
    kpis: {
      total_revenue: number;
      total_orders: number;
      total_customers: number;
      total_pizzas: number;
      pending_orders: number;
      low_stock_count: number;
      average_order_value: number;
    };
    charts: {
      monthly_sales: Array<{ month_label: string; revenue: number; total_orders: number }>;
      popular_pizzas: Array<{ pizza_name: string; units_sold: number; revenue: number }>;
      category_sales: Array<{ category_name: string; revenue: number; units_sold: number }>;
    };
    low_stock_alerts: Ingredient[];
    recent_orders: Order[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest<any>('/api/admin/dashboard')
      .then((res) => setData(res))
      .catch((err) => showToast('Failed to load dashboard', 'error', err?.message))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-28 rounded-xl bg-white border border-stone-200 animate-pulse"
            />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-white border border-stone-200 animate-pulse" />
      </div>
    );
  }

  const { kpis, charts, low_stock_alerts, recent_orders } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Executive DBMS Dashboard</h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time aggregations from <code>orders</code>, <code>order_items</code>,{' '}
            <code>users</code>, <code>pizzas</code>, and <code>ingredients</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports"
            className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
          >
            Export CSV Reports
          </Link>
          <Link
            to="/admin/sql-lab"
            className="px-3.5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
          >
            Open SQL & Views Lab
          </Link>
        </div>
      </div>

      {/* 5 Required Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-xs font-medium text-stone-500">Total Revenue</div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
            ₹{kpis.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-stone-500 font-mono mt-1">
            Avg Order: ₹{kpis.average_order_value}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-xs font-medium text-stone-500">Total Orders</div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
            {kpis.total_orders}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">All recorded orders</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-xs font-medium text-stone-500">Total Customers</div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
            {kpis.total_customers}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Registered customer accounts</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-xs font-medium text-stone-500">Total Pizzas</div>
          <div className="text-2xl font-bold font-mono text-stone-900 mt-2 tabular-nums">
            {kpis.total_pizzas}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Across 4 categories (48 sizes)</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-xs font-medium text-stone-500">Pending / Active Orders</div>
          <div className="text-2xl font-bold font-mono text-orange-600 mt-2 tabular-nums">
            {kpis.pending_orders}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">In kitchen or out for delivery</div>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {low_stock_alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-950">
                Kitchen Inventory Alert: {low_stock_alerts.length} Ingredient(s) Below Reorder
                Threshold
              </div>
              <div className="text-xs text-amber-800 mt-0.5 font-mono">
                {low_stock_alerts
                  .map(
                    (i) =>
                      `${i.name} (${i.current_stock} ${i.unit} / min ${i.min_reorder_level} ${i.unit})`
                  )
                  .join(' · ')}
              </div>
            </div>
          </div>
          <Link
            to="/admin/inventory"
            className="px-3.5 py-2 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            Restock Ingredients →
          </Link>
        </div>
      )}

      {/* 3 Required Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Monthly Sales */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">Monthly Sales Trend (₹)</h2>
              <p className="text-xs text-stone-500">
                Procedure: <code>GenerateMonthlySalesReport(2026)</code>
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthly_sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (₹)"
                  stroke="#F97316"
                  fill="#FFEDD5"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category-wise Sales */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-stone-900">Category-Wise Revenue (₹)</h2>
            <p className="text-xs text-stone-500">Aggregated across 4 pizza categories</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.category_sales} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="category_name"
                  width={130}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenue (₹)" fill="#1C1917" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Popular Pizzas & Recent Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-stone-900">Top Popular Pizzas Sold</h2>
            <p className="text-xs text-stone-500">
              View: <code>pizza_sales_view</code>
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.popular_pizzas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis
                  dataKey="pizza_name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="units_sold"
                  name="Units Sold"
                  fill="#F97316"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">Recent Customer Orders</h2>
              <p className="text-xs text-stone-500">
                View: <code>order_summary_view</code>
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              <span>Manage All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2.5 pr-3 font-semibold">Order #</th>
                  <th className="py-2.5 px-3 font-semibold">Customer</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Payment</th>
                  <th className="py-2.5 pl-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recent_orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50">
                    <td className="py-2.5 pr-3 font-mono font-semibold text-stone-900">
                      {ord.order_number}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">{ord.customer_name}</td>
                    <td className="py-2.5 px-3 font-semibold text-stone-800">
                      {ord.order_status}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-stone-500">
                      {ord.payment_method} ({ord.payment_status})
                    </td>
                    <td className="py-2.5 pl-3 font-mono font-bold text-stone-900 text-right tabular-nums">
                      ₹{ord.final_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
