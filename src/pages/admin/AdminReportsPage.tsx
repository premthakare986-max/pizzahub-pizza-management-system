import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { apiRequest } from '../../services/api.ts';
import { useToast } from '../../hooks/useToast.tsx';

type ReportTab =
  | 'daily_sales'
  | 'weekly_sales'
  | 'monthly_sales'
  | 'popular_pizzas'
  | 'customer_orders'
  | 'category_sales'
  | 'order_status_report'
  | 'inventory_report';

export function AdminReportsPage() {
  const [reports, setReports] = useState<Record<string, any[]> | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('monthly_sales');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest<any>('/api/admin/reports/summary')
      .then((res) => setReports(res))
      .catch((err) => showToast('Failed to load reports', 'error', err?.message))
      .finally(() => setLoading(false));
  }, [showToast]);

  const exportToCSV = (rows: any[], filename: string) => {
    if (!rows || rows.length === 0) {
      showToast('No rows to export', 'info');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pizzahub_${filename}_2026.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported pizzahub_${filename}_2026.csv`, 'success');
  };

  const tabs: Array<{ id: ReportTab; label: string }> = [
    { id: 'monthly_sales', label: 'Monthly Sales' },
    { id: 'daily_sales', label: 'Daily Sales' },
    { id: 'weekly_sales', label: 'Weekly Sales' },
    { id: 'popular_pizzas', label: 'Popular Pizzas' },
    { id: 'customer_orders', label: 'Customer-Wise Orders' },
    { id: 'category_sales', label: 'Category-Wise Sales' },
    { id: 'order_status_report', label: 'Order Status Report' },
    { id: 'inventory_report', label: 'Inventory Valuation' },
  ];

  const activeRows = reports ? reports[activeTab] || [] : [];
  const columns = activeRows.length > 0 ? Object.keys(activeRows[0]) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">DBMS Analytical Reports & CSV Export</h1>
          <p className="text-xs text-stone-500 mt-1">
            Generate and export Daily, Weekly, Monthly, Popular Pizzas, Customer, Category, Status,
            and Inventory reports.
          </p>
        </div>
        <button
          onClick={() => exportToCSV(activeRows, activeTab)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Export Current Report to CSV</span>
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white border border-stone-200 rounded-xl p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Data Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                {columns.map((col) => (
                  <th key={col} className="py-3 px-4 font-semibold uppercase tracking-wider">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    Generating report...
                  </td>
                </tr>
              ) : activeRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    No records found for this report.
                  </td>
                </tr>
              ) : (
                activeRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-stone-50">
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="py-3 px-4 font-mono text-stone-800 whitespace-nowrap tabular-nums"
                      >
                        {typeof row[col] === 'number' &&
                        (col.includes('revenue') ||
                          col.includes('sales') ||
                          col.includes('spend') ||
                          col.includes('amount') ||
                          col.includes('price') ||
                          col.includes('valuation') ||
                          col.includes('tax') ||
                          col.includes('discount'))
                          ? `₹${row[col].toFixed(2)}`
                          : String(row[col] ?? '—')}
                      </td>
                    ))}
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
