import React, { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, ArrowUpCircle, X } from 'lucide-react';
import { Ingredient, InventoryTransaction } from '../../types/index.ts';
import { apiRequest } from '../../services/api.ts';
import { useToast } from '../../hooks/useToast.tsx';

export function AdminInventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Ingredient | null>(null);

  // Add Ingredient State
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [newStock, setNewStock] = useState('25');
  const [newReorder, setNewReorder] = useState('10');
  const [newCost, setNewCost] = useState('320');
  const [newSupplier, setNewSupplier] = useState('Napoli Imports India Pvt Ltd');

  // Restock / Adjust State
  const [txType, setTxType] = useState<'RESTOCK' | 'ADJUSTMENT' | 'WASTAGE'>('RESTOCK');
  const [qtyChange, setQtyChange] = useState('10');
  const [txNotes, setTxNotes] = useState('Fresh supplier delivery batch');
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        ingredients: Ingredient[];
        transactions: InventoryTransaction[];
      }>('/api/admin/inventory');
      setIngredients(res.ingredients || []);
      setTransactions(res.transactions || []);
    } catch (err: any) {
      showToast('Failed to load inventory', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/api/admin/inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          sku: newSku,
          unit: newUnit,
          current_stock: Number(newStock),
          min_reorder_level: Number(newReorder),
          cost_per_unit: Number(newCost),
          supplier_name: newSupplier,
        }),
      });
      showToast('Ingredient added to kitchen inventory', 'success');
      setAddModalOpen(false);
      setNewName('');
      setNewSku('');
      await fetchInventory();
    } catch (err: any) {
      showToast('Failed to add ingredient', 'error', err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>(
        `/api/admin/inventory/${restockTarget.id}/stock`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            transaction_type: txType,
            quantity_change: Number(qtyChange),
            notes: txNotes,
          }),
        }
      );
      showToast('Inventory Updated & Trigger Fired', 'success', res.message);
      setRestockTarget(null);
      await fetchInventory();
    } catch (err: any) {
      showToast('Failed to update stock', 'error', err?.message);
    } finally {
      setSaving(false);
    }
  };

  const lowStockList = ingredients.filter((i) => i.is_low_stock);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Kitchen Inventory & Trigger Audit Logs
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage <code>ingredients</code> and <code>inventory_transactions</code> (monitored by{' '}
            <code>trg_after_order_item_insert_deduct_stock</code> &{' '}
            <code>trg_after_ingredient_update_log_transaction</code>).
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Ingredient</span>
        </button>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-red-900">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>
              Low-Stock Alert ({lowStockList.length} Ingredients at or below min_reorder_level)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {lowStockList.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-red-200 rounded-lg p-3 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-stone-900">{item.name}</div>
                  <div className="font-mono text-red-700 mt-0.5">
                    Stock: {item.current_stock} {item.unit} (Min: {item.min_reorder_level}{' '}
                    {item.unit})
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRestockTarget(item);
                    setTxType('RESTOCK');
                    setQtyChange('15');
                    setTxNotes(`Emergency restock for ${item.name}`);
                  }}
                  className="px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold shrink-0"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 font-bold text-xs text-stone-800">
          Raw Kitchen Ingredients ({ingredients.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-3 font-semibold">Ingredient Name</th>
                <th className="py-3 px-3 font-semibold">Supplier</th>
                <th className="py-3 px-3 font-semibold text-right">Current Stock</th>
                <th className="py-3 px-3 font-semibold text-right">Min Reorder</th>
                <th className="py-3 px-3 font-semibold text-right">Cost / Unit</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : (
                ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-mono text-stone-500">{ing.sku}</td>
                    <td className="py-3 px-3 font-bold text-stone-900">{ing.name}</td>
                    <td className="py-3 px-3 text-stone-600">{ing.supplier_name}</td>
                    <td className="py-3 px-3 font-mono font-bold text-stone-900 text-right tabular-nums">
                      {ing.current_stock.toFixed(2)} {ing.unit}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-500 text-right tabular-nums">
                      {ing.min_reorder_level.toFixed(2)} {ing.unit}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-700 text-right tabular-nums">
                      ₹{ing.cost_per_unit}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          ing.is_low_stock
                            ? 'text-red-700 font-bold'
                            : 'text-emerald-700 font-semibold'
                        }
                      >
                        {ing.is_low_stock ? 'LOW STOCK ALERT' : 'Healthy'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setRestockTarget(ing);
                          setTxType('RESTOCK');
                          setQtyChange('10');
                          setTxNotes(`Restocked ${ing.name}`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-orange-500 text-white font-semibold transition-colors"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>Update Stock</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Transactions Audit Log */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 font-bold text-xs text-stone-800">
          Inventory Transactions Audit Trail (inventory_transactions table · {transactions.length}{' '}
          records)
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Ingredient</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold text-right">Qty Delta</th>
                <th className="py-2.5 px-3 font-semibold text-right">Before → After</th>
                <th className="py-2.5 px-4 font-semibold">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50">
                  <td className="py-2.5 px-4 font-mono text-stone-500 whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-stone-900">
                    {tx.ingredient_name}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-stone-800">
                    {tx.transaction_type}
                  </td>
                  <td
                    className={`py-2.5 px-3 font-mono font-bold text-right tabular-nums ${
                      tx.quantity_change >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {tx.quantity_change >= 0 ? `+${tx.quantity_change}` : tx.quantity_change}{' '}
                    {tx.unit}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-stone-600 text-right tabular-nums">
                    {tx.stock_before} → {tx.stock_after}
                  </td>
                  <td className="py-2.5 px-4 text-stone-600">{tx.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h2 className="text-lg font-bold text-stone-900">Add New Kitchen Ingredient</h2>
              <button onClick={() => setAddModalOpen(false)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddIngredient} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ingredient Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Smoked Provolone Cheese"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="ING-PRV-013"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="kg / liters"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Min Reorder</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newReorder}
                    onChange={(e) => setNewReorder(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Cost / Unit ₹</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-orange-500 text-white font-semibold"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock / Adjust Modal */}
      {restockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Update Stock: {restockTarget.name}
                </h2>
                <p className="text-xs font-mono text-stone-500">
                  Current Stock: {restockTarget.current_stock} {restockTarget.unit}
                </p>
              </div>
              <button onClick={() => setRestockTarget(null)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleStockUpdate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Transaction Type</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="RESTOCK">RESTOCK (+ Add Stock)</option>
                  <option value="WASTAGE">WASTAGE (- Deduct Spoiled/Used)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (+/- Audit Delta)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Quantity ({restockTarget.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={qtyChange}
                  onChange={(e) => setQtyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Audit Notes *</label>
                <input
                  type="text"
                  required
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setRestockTarget(null)}
                  className="px-4 py-2 rounded-lg text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-orange-500 text-white font-semibold"
                >
                  Apply & Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
