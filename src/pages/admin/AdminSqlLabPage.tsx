import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, Database, Eye } from 'lucide-react';
import { apiRequest } from '../../services/api.ts';
import { useToast } from '../../hooks/useToast.tsx';

export function AdminSqlLabPage() {
  const [scripts, setScripts] = useState<Record<string, string>>({});
  const [views, setViews] = useState<{
    order_summary_view: any[];
    pizza_sales_view: any[];
  } | null>(null);
  const [activeFile, setActiveFile] = useState<string>('schema.sql');
  const [activeView, setActiveView] = useState<'order_summary_view' | 'pizza_sales_view'>(
    'order_summary_view'
  );
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    apiRequest<{ scripts: Record<string, string>; views: any }>('/api/admin/sql-lab')
      .then((res) => {
        setScripts(res.scripts || {});
        setViews(res.views || null);
      })
      .catch((err) => showToast('Failed to load SQL scripts', 'error', err?.message));
  }, [showToast]);

  const handleCopySql = () => {
    const content = scripts[activeFile] || '';
    navigator.clipboard?.writeText(content).catch(() => {});
    setCopied(true);
    showToast(`Copied database/${activeFile} to clipboard`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const content = scripts[activeFile] || '';
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fileList = [
    { name: 'schema.sql', desc: '14 Normalized Tables, PKs, FKs, Indexes' },
    { name: 'seed.sql', desc: 'Realistic Sample Data for All 14 Tables' },
    { name: 'queries.sql', desc: '22 Executable SQL Queries (JOINs, GROUP BY, Subqueries)' },
    { name: 'procedures.sql', desc: '5 Stored Procedures (AddNewPizza, PlaceCustomerOrder...)' },
    { name: 'views.sql', desc: '2 Views (order_summary_view & pizza_sales_view)' },
    { name: 'triggers.sql', desc: '2 Inventory Stock & Audit Logging Triggers' },
    { name: 'transactions.sql', desc: 'ACID START TRANSACTION, COMMIT, and ROLLBACK' },
  ];

  const currentViewRows = views ? views[activeView] || [] : [];
  const viewCols = currentViewRows.length > 0 ? Object.keys(currentViewRows[0]) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          DBMS Mini Project SQL Scripts, Views, Triggers & ER Architecture
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Inspect, copy, or download all 7 MySQL 8.0+ scripts from <code>/database/</code> and view
          live output from <code>order_summary_view</code> and <code>pizza_sales_view</code>.
        </p>
      </div>

      {/* Live SQL Views Output */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-orange-500" />
            <h2 className="text-base font-bold text-stone-900">
              Live Relational Views (database/views.sql)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('order_summary_view')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold ${
                activeView === 'order_summary_view'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              SELECT * FROM order_summary_view
            </button>
            <button
              onClick={() => setActiveView('pizza_sales_view')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold ${
                activeView === 'pizza_sales_view'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              SELECT * FROM pizza_sales_view
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 border border-stone-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600">
                {viewCols.map((c) => (
                  <th key={c} className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {currentViewRows.map((row, i) => (
                <tr key={i} className="hover:bg-stone-50">
                  {viewCols.map((c) => (
                    <td key={c} className="py-2 px-3 font-mono text-stone-800 whitespace-nowrap">
                      {String(row[c] ?? 'NULL')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Script Viewer & Downloader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-3 space-y-1.5">
          <div className="px-3 py-2 text-xs font-bold text-stone-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-500" />
            <span>/database/ SQL Files</span>
          </div>
          {fileList.map((f) => (
            <button
              key={f.name}
              onClick={() => setActiveFile(f.name)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeFile === f.name
                  ? 'bg-stone-900 text-white'
                  : 'hover:bg-stone-100 text-stone-800'
              }`}
            >
              <div className="text-xs font-mono font-bold">{f.name}</div>
              <div
                className={`text-[11px] mt-0.5 ${
                  activeFile === f.name ? 'text-stone-300' : 'text-stone-500'
                }`}
              >
                {f.desc}
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 bg-stone-950 text-stone-100 rounded-xl border border-stone-800 overflow-hidden">
          <div className="px-4 py-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-orange-400">
              database/{activeFile}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy SQL'}</span>
              </button>
              <button
                onClick={handleDownloadSql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {activeFile}</span>
              </button>
            </div>
          </div>
          <pre className="p-5 text-xs font-mono text-stone-200 overflow-x-auto max-h-[540px] leading-relaxed">
            {scripts[activeFile] || 'Loading SQL script...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
