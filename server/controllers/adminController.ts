import { Request, Response } from 'express';
import {
  dbState,
  getEnrichedOrder,
  executeOnMySQLIfConnected,
  getSqlScriptContents,
} from '../services/relationalStore.ts';

function computeMonthlySales() {
  const buckets = new Map<
    string,
    {
      month_key: string;
      month_label: string;
      total_orders: number;
      completed_orders: number;
      cancelled_orders: number;
      net_food_sales: number;
      tax_collected: number;
      discounts_given: number;
      revenue: number;
    }
  >();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (const order of dbState.orders) {
    const dt = new Date(order.created_at);
    const year = dt.getUTCFullYear();
    const monthIdx = dt.getUTCMonth();
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    const label = `${monthNames[monthIdx]} ${year}`;

    if (!buckets.has(key)) {
      buckets.set(key, {
        month_key: key,
        month_label: label,
        total_orders: 0,
        completed_orders: 0,
        cancelled_orders: 0,
        net_food_sales: 0,
        tax_collected: 0,
        discounts_given: 0,
        revenue: 0,
      });
    }

    const entry = buckets.get(key)!;
    entry.total_orders += 1;
    if (order.order_status === 'Cancelled') {
      entry.cancelled_orders += 1;
    } else {
      entry.completed_orders += 1;
      entry.net_food_sales = Number((entry.net_food_sales + order.subtotal).toFixed(2));
      entry.tax_collected = Number((entry.tax_collected + order.tax_amount).toFixed(2));
      entry.discounts_given = Number((entry.discounts_given + order.discount_amount).toFixed(2));
      entry.revenue = Number((entry.revenue + order.final_amount).toFixed(2));
    }
  }

  return Array.from(buckets.values()).sort((a, b) => a.month_key.localeCompare(b.month_key));
}

function computePopularPizzas() {
  const validOrderIds = new Set(
    dbState.orders.filter((o) => o.order_status !== 'Cancelled').map((o) => o.id)
  );

  return dbState.pizzas
    .map((pizza) => {
      const cat = dbState.categories.find((c) => c.id === pizza.category_id);
      const items = dbState.order_items.filter(
        (oi) => oi.pizza_id === pizza.id && validOrderIds.has(oi.order_id)
      );
      const unitsSold = items.reduce((sum, oi) => sum + oi.quantity, 0);
      const revenue = Number(items.reduce((sum, oi) => sum + oi.line_total, 0).toFixed(2));
      const ordersCount = new Set(items.map((oi) => oi.order_id)).size;

      return {
        pizza_id: pizza.id,
        pizza_name: pizza.name,
        category_name: cat?.name || 'Uncategorized',
        is_veg: pizza.is_veg,
        base_price: pizza.base_price,
        orders_placed: ordersCount,
        units_sold: unitsSold,
        revenue,
      };
    })
    .sort((a, b) => b.units_sold - a.units_sold || b.revenue - a.revenue);
}

function computeCategoryWiseSales() {
  const validOrderIds = new Set(
    dbState.orders.filter((o) => o.order_status !== 'Cancelled').map((o) => o.id)
  );

  return dbState.categories.map((cat) => {
    const catPizzaIds = new Set(
      dbState.pizzas.filter((p) => p.category_id === cat.id).map((p) => p.id)
    );
    const items = dbState.order_items.filter(
      (oi) => catPizzaIds.has(oi.pizza_id) && validOrderIds.has(oi.order_id)
    );
    const unitsSold = items.reduce((sum, oi) => sum + oi.quantity, 0);
    const revenue = Number(items.reduce((sum, oi) => sum + oi.line_total, 0).toFixed(2));

    return {
      category_id: cat.id,
      category_name: cat.name,
      total_pizzas_in_catalog: catPizzaIds.size,
      units_sold: unitsSold,
      revenue,
    };
  });
}

export async function getDashboardStats(_req: Request, res: Response) {
  const nonCancelledOrders = dbState.orders.filter((o) => o.order_status !== 'Cancelled');
  const totalRevenue = Number(
    nonCancelledOrders.reduce((sum, o) => sum + o.final_amount, 0).toFixed(2)
  );
  const totalOrders = dbState.orders.length;
  const totalCustomers = dbState.users.filter((u) => u.role === 'customer').length;
  const totalPizzas = dbState.pizzas.length;
  const pendingOrders = dbState.orders.filter((o) =>
    ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.order_status)
  ).length;
  const lowStockIngredients = dbState.ingredients.filter(
    (i) => i.current_stock <= i.min_reorder_level
  );

  const monthlySales = computeMonthlySales();
  const popularPizzas = computePopularPizzas().slice(0, 6);
  const categorySales = computeCategoryWiseSales();
  const recentOrders = [...dbState.orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
    .map(getEnrichedOrder);

  return res.json({
    success: true,
    kpis: {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      total_customers: totalCustomers,
      total_pizzas: totalPizzas,
      pending_orders: pendingOrders,
      low_stock_count: lowStockIngredients.length,
      average_order_value:
        nonCancelledOrders.length > 0
          ? Number((totalRevenue / nonCancelledOrders.length).toFixed(2))
          : 0,
    },
    charts: {
      monthly_sales: monthlySales,
      popular_pizzas: popularPizzas,
      category_sales: categorySales,
    },
    low_stock_alerts: lowStockIngredients,
    recent_orders: recentOrders,
  });
}

export async function getCustomers(req: Request, res: Response) {
  const { search } = req.query;
  let customers = dbState.users.filter((u) => u.role === 'customer');

  if (search && String(search).trim() !== '') {
    const q = String(search).trim().toLowerCase();
    customers = customers.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
    );
  }

  const enriched = customers.map((u) => {
    const userOrders = dbState.orders
      .filter((o) => o.user_id === u.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(getEnrichedOrder);
    const validOrders = userOrders.filter((o) => o.order_status !== 'Cancelled');
    const lifetimeSpend = Number(
      validOrders.reduce((sum, o) => sum + o.final_amount, 0).toFixed(2)
    );
    const addresses = dbState.addresses.filter((a) => a.user_id === u.id);

    return {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      is_active: u.is_active,
      created_at: u.created_at,
      total_orders: userOrders.length,
      lifetime_spend: lifetimeSpend,
      addresses,
      orders: userOrders,
    };
  });

  return res.json({
    success: true,
    count: enriched.length,
    customers: enriched,
  });
}

export async function getInventory(_req: Request, res: Response) {
  const ingredients = dbState.ingredients.map((ing) => {
    const isLow = ing.current_stock <= ing.min_reorder_level;
    const stockValuation = Number((ing.current_stock * ing.cost_per_unit).toFixed(2));
    const pizzasUsing = dbState.pizza_ingredients.filter((pi) => pi.ingredient_id === ing.id).length;

    return {
      ...ing,
      is_low_stock: isLow,
      shortage_amount: isLow ? Number((ing.min_reorder_level - ing.current_stock).toFixed(2)) : 0,
      stock_valuation: stockValuation,
      pizzas_using_count: pizzasUsing,
    };
  });

  const transactions = [...dbState.inventory_transactions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((tx) => {
      const ing = dbState.ingredients.find((i) => i.id === tx.ingredient_id);
      const ord = tx.order_id ? dbState.orders.find((o) => o.id === tx.order_id) : null;
      return {
        ...tx,
        ingredient_name: ing?.name || 'Ingredient',
        sku: ing?.sku || '',
        unit: ing?.unit || '',
        order_number: ord?.order_number || null,
      };
    });

  return res.json({
    success: true,
    ingredients,
    low_stock_alerts: ingredients.filter((i) => i.is_low_stock),
    transactions,
  });
}

export async function addIngredient(req: Request, res: Response) {
  const { name, sku, unit, current_stock, min_reorder_level, cost_per_unit, supplier_name } = req.body;
  const trimmedName = String(name).trim();
  const trimmedSku = String(sku).trim().toUpperCase();

  if (
    dbState.ingredients.some(
      (i) => i.name.toLowerCase() === trimmedName.toLowerCase() || i.sku.toUpperCase() === trimmedSku
    )
  ) {
    return res.status(409).json({
      success: false,
      message: 'Ingredient with this name or SKU already exists.',
    });
  }

  const nextId = dbState.ingredients.reduce((max, i) => Math.max(max, i.id), 0) + 1;
  const now = new Date().toISOString();
  const initialStock = Number(current_stock || 0);

  const newIng = {
    id: nextId,
    name: trimmedName,
    sku: trimmedSku,
    unit: String(unit || 'kg').trim(),
    current_stock: initialStock,
    min_reorder_level: Number(min_reorder_level || 10),
    cost_per_unit: Number(cost_per_unit || 100),
    supplier_name: String(supplier_name || 'Local Kitchen Supplier').trim(),
    last_restocked_at: now,
    created_at: now,
    updated_at: now,
  };

  dbState.ingredients.push(newIng);

  const nextTxId = dbState.inventory_transactions.reduce((max, tx) => Math.max(max, tx.id), 0) + 1;
  dbState.inventory_transactions.push({
    id: nextTxId,
    ingredient_id: newIng.id,
    order_id: null,
    transaction_type: 'RESTOCK',
    quantity_change: initialStock,
    stock_before: 0,
    stock_after: initialStock,
    notes: `Initial stock entry for ${newIng.name}`,
    performed_by: req.user!.userId,
    created_at: now,
  });

  await executeOnMySQLIfConnected(
    'INSERT INTO ingredients (id, name, sku, unit, current_stock, min_reorder_level, cost_per_unit, supplier_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [newIng.id, newIng.name, newIng.sku, newIng.unit, newIng.current_stock, newIng.min_reorder_level, newIng.cost_per_unit, newIng.supplier_name]
  );

  return res.status(201).json({
    success: true,
    message: 'Ingredient added and initial inventory transaction logged.',
    ingredient: newIng,
  });
}

export async function updateIngredientStock(req: Request, res: Response) {
  const id = Number(req.params.id);
  const ing = dbState.ingredients.find((i) => i.id === id);
  if (!ing) {
    return res.status(404).json({ success: false, message: 'Ingredient not found.' });
  }

  const { transaction_type, quantity_change, notes, min_reorder_level, cost_per_unit } = req.body;
  const qtyDelta = Number(quantity_change || 0);
  const stockBefore = ing.current_stock;
  const now = new Date().toISOString();

  let finalDelta = qtyDelta;
  if (transaction_type === 'WASTAGE' && qtyDelta > 0) {
    finalDelta = -qtyDelta;
  }

  const stockAfter = Math.max(0, Number((stockBefore + finalDelta).toFixed(2)));
  ing.current_stock = stockAfter;
  if (finalDelta > 0) ing.last_restocked_at = now;
  if (min_reorder_level !== undefined) ing.min_reorder_level = Number(min_reorder_level);
  if (cost_per_unit !== undefined) ing.cost_per_unit = Number(cost_per_unit);
  ing.updated_at = now;

  // Fires trg_after_ingredient_update_log_transaction
  if (finalDelta !== 0) {
    const nextTxId = dbState.inventory_transactions.reduce((max, tx) => Math.max(max, tx.id), 0) + 1;
    dbState.inventory_transactions.push({
      id: nextTxId,
      ingredient_id: ing.id,
      order_id: null,
      transaction_type: (transaction_type || (finalDelta > 0 ? 'RESTOCK' : 'ADJUSTMENT')) as any,
      quantity_change: finalDelta,
      stock_before: stockBefore,
      stock_after: stockAfter,
      notes: String(notes || (finalDelta > 0 ? 'Manual kitchen restock' : 'Stock adjustment')).trim(),
      performed_by: req.user!.userId,
      created_at: now,
    });
  }

  await executeOnMySQLIfConnected(
    'UPDATE ingredients SET current_stock = ?, min_reorder_level = ?, cost_per_unit = ?, last_restocked_at = CURRENT_TIMESTAMP WHERE id = ?',
    [ing.current_stock, ing.min_reorder_level, ing.cost_per_unit, ing.id]
  );

  return res.json({
    success: true,
    message: `Stock updated for ${ing.name} (${stockBefore} -> ${stockAfter} ${ing.unit}) and audit trigger logged.`,
    ingredient: ing,
  });
}

export async function getPayments(_req: Request, res: Response) {
  const payments = [...dbState.payments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((p) => {
      const order = dbState.orders.find((o) => o.id === p.order_id);
      const user = order ? dbState.users.find((u) => u.id === order.user_id) : null;
      return {
        ...p,
        order_number: order?.order_number || `ORD-${p.order_id}`,
        order_status: order?.order_status || 'Pending',
        customer_name: user?.full_name || 'Customer',
        customer_email: user?.email || '',
      };
    });

  return res.json({
    success: true,
    payments,
  });
}

export async function getReportsSummary(_req: Request, res: Response) {
  const nonCancelled = dbState.orders.filter((o) => o.order_status !== 'Cancelled');

  // 1. Daily Sales Report
  const dailyMap = new Map<string, { date: string; orders_count: number; subtotal: number; tax: number; discount: number; revenue: number }>();
  for (const o of nonCancelled) {
    const dateKey = o.created_at.slice(0, 10);
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { date: dateKey, orders_count: 0, subtotal: 0, tax: 0, discount: 0, revenue: 0 });
    }
    const d = dailyMap.get(dateKey)!;
    d.orders_count += 1;
    d.subtotal = Number((d.subtotal + o.subtotal).toFixed(2));
    d.tax = Number((d.tax + o.tax_amount).toFixed(2));
    d.discount = Number((d.discount + o.discount_amount).toFixed(2));
    d.revenue = Number((d.revenue + o.final_amount).toFixed(2));
  }
  const dailySales = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));

  // 2. Weekly Sales Report
  const weeklyMap = new Map<string, { week_label: string; orders_count: number; revenue: number; avg_order_value: number }>();
  for (const o of nonCancelled) {
    const dt = new Date(o.created_at);
    const startOfYear = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((dt.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getUTCDay() + 1) / 7);
    const key = `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    if (!weeklyMap.has(key)) {
      weeklyMap.set(key, { week_label: key, orders_count: 0, revenue: 0, avg_order_value: 0 });
    }
    const w = weeklyMap.get(key)!;
    w.orders_count += 1;
    w.revenue = Number((w.revenue + o.final_amount).toFixed(2));
    w.avg_order_value = Number((w.revenue / w.orders_count).toFixed(2));
  }
  const weeklySales = Array.from(weeklyMap.values()).sort((a, b) => b.week_label.localeCompare(a.week_label));

  // 3. Monthly Sales Report (GenerateMonthlySalesReport procedure output)
  const monthlySales = computeMonthlySales();

  // 4. Popular Pizzas Report (pizza_sales_view)
  const popularPizzas = computePopularPizzas();

  // 5. Customer-wise Orders Report
  const customerReport = dbState.users
    .filter((u) => u.role === 'customer')
    .map((u) => {
      const allOrders = dbState.orders.filter((o) => o.user_id === u.id);
      const valid = allOrders.filter((o) => o.order_status !== 'Cancelled');
      const totalSpent = Number(valid.reduce((s, o) => s + o.final_amount, 0).toFixed(2));
      return {
        customer_id: u.id,
        customer_name: u.full_name,
        email: u.email,
        phone: u.phone,
        total_orders: allOrders.length,
        completed_orders: valid.length,
        cancelled_orders: allOrders.length - valid.length,
        lifetime_spend: totalSpent,
        avg_order_spend: valid.length > 0 ? Number((totalSpent / valid.length).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.lifetime_spend - a.lifetime_spend);

  // 6. Category-wise Sales Report
  const categorySales = computeCategoryWiseSales();

  // 7. Order Status Report
  const statusGroups = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const orderStatusReport = statusGroups.map((st) => {
    const matching = dbState.orders.filter((o) => o.order_status === st);
    const totalVal = Number(matching.reduce((s, o) => s + o.final_amount, 0).toFixed(2));
    return {
      order_status: st,
      order_count: matching.length,
      percentage_share:
        dbState.orders.length > 0
          ? Number(((matching.length * 100) / dbState.orders.length).toFixed(1))
          : 0,
      total_amount: totalVal,
    };
  });

  // 8. Inventory Report
  const inventoryReport = dbState.ingredients.map((i) => ({
    sku: i.sku,
    ingredient_name: i.name,
    current_stock: i.current_stock,
    min_reorder_level: i.min_reorder_level,
    unit: i.unit,
    cost_per_unit: i.cost_per_unit,
    stock_valuation: Number((i.current_stock * i.cost_per_unit).toFixed(2)),
    status: i.current_stock <= i.min_reorder_level ? 'LOW_STOCK' : 'HEALTHY',
    supplier_name: i.supplier_name,
  }));

  return res.json({
    success: true,
    daily_sales: dailySales,
    weekly_sales: weeklySales,
    monthly_sales: monthlySales,
    popular_pizzas: popularPizzas,
    customer_orders: customerReport,
    category_sales: categorySales,
    order_status_report: orderStatusReport,
    inventory_report: inventoryReport,
  });
}

export async function getSalesReport(_req: Request, res: Response) {
  return res.json({
    success: true,
    monthly_sales: computeMonthlySales(),
    category_sales: computeCategoryWiseSales(),
  });
}

export async function getPopularPizzasReport(_req: Request, res: Response) {
  return res.json({
    success: true,
    popular_pizzas: computePopularPizzas(),
  });
}

export async function getSqlScriptsAndViews(_req: Request, res: Response) {
  const scripts = getSqlScriptContents();
  const orderSummaryView = dbState.orders.map((o) => {
    const enriched = getEnrichedOrder(o);
    return {
      order_id: o.id,
      order_number: o.order_number,
      customer_name: enriched.customer_name,
      customer_email: enriched.customer_email,
      order_status: o.order_status,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      total_pizza_count: enriched.total_pizza_count,
      subtotal: o.subtotal,
      tax_amount: o.tax_amount,
      final_amount: o.final_amount,
      order_date: o.created_at,
    };
  });

  const pizzaSalesView = computePopularPizzas();

  return res.json({
    success: true,
    scripts,
    views: {
      order_summary_view: orderSummaryView,
      pizza_sales_view: pizzaSalesView,
    },
  });
}
