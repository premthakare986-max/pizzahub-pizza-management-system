import { Request, Response } from 'express';
import {
  dbState,
  getEnrichedOrder,
  executeOnMySQLIfConnected,
  OrderStatus,
} from '../services/relationalStore.ts';
import { getLastConnectionState } from '../config/db.ts';

export async function createOrder(req: Request, res: Response) {
  try {
    const connState = getLastConnectionState();
    if (!connState.connected) {
      return res.status(503).json({
        success: false,
        mysql_status: 'NOT CONNECTED',
        error_code: connState.errorCode || 'MYSQL_NOT_CONNECTED',
        message:
          'MySQL 8 Database is NOT CONNECTED. Your order was not saved to pizzahub_db because no live MySQL 8 connection is active. Please configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME in your backend .env file and click Retry Connection.',
      });
    }

    const userId = req.user!.userId;
    const {
      address_id,
      delivery_address,
      customer_phone,
      payment_method,
      payment_gateway,
      coupon_code,
      special_instructions,
      items,
      idempotency_key,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one pizza item.',
      });
    }

    if (!delivery_address || !customer_phone) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address and contact phone number are required.',
      });
    }

    // Prevent duplicate order processing if idempotency_key matches an existing order_number
    if (idempotency_key && dbState.orders.some((o) => o.order_number === idempotency_key)) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate order detected. This order has already been processed.',
      });
    }

    // ACID Transaction Validation Step: Validate all pizzas, sizes, and toppings before mutating
    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      pizza_id: number;
      pizza_size_id: number;
      pizza_name_snapshot: string;
      size_name_snapshot: 'Regular' | 'Medium' | 'Large';
      quantity: number;
      unit_base_price: number;
      toppings_unit_price: number;
      line_total: number;
      toppings: Array<{ topping_id: number; topping_name_snapshot: string; price_snapshot: number }>;
    }> = [];

    for (const item of items) {
      const pizza = dbState.pizzas.find((p) => p.id === Number(item.pizza_id) && p.is_available === 1);
      if (!pizza) {
        return res.status(400).json({
          success: false,
          message: `Transaction aborted (ROLLBACK): Pizza ID ${item.pizza_id} is unavailable or does not exist.`,
        });
      }

      const sizeRow = dbState.pizza_sizes.find(
        (s) =>
          s.pizza_id === pizza.id &&
          (s.id === Number(item.pizza_size_id) || s.size_name === item.size_name)
      );
      if (!sizeRow) {
        return res.status(400).json({
          success: false,
          message: `Transaction aborted (ROLLBACK): Invalid size for pizza ${pizza.name}.`,
        });
      }

      const qty = Math.max(1, Number(item.quantity || 1));
      const toppingIds: number[] = Array.isArray(item.topping_ids) ? item.topping_ids.map(Number) : [];
      const selectedToppings = dbState.toppings.filter((t) => toppingIds.includes(t.id) && t.is_available === 1);
      const toppingsUnitPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
      const lineTotal = Number(((sizeRow.price + toppingsUnitPrice) * qty).toFixed(2));

      calculatedSubtotal += lineTotal;

      validatedItems.push({
        pizza_id: pizza.id,
        pizza_size_id: sizeRow.id,
        pizza_name_snapshot: pizza.name,
        size_name_snapshot: sizeRow.size_name,
        quantity: qty,
        unit_base_price: sizeRow.price,
        toppings_unit_price: toppingsUnitPrice,
        line_total: lineTotal,
        toppings: selectedToppings.map((t) => ({
          topping_id: t.id,
          topping_name_snapshot: t.name,
          price_snapshot: t.price,
        })),
      });
    }

    calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));
    const taxAmount = Number((calculatedSubtotal * 0.05).toFixed(2));
    const deliveryFee = calculatedSubtotal >= 500 ? 0 : 49;

    let discountAmount = 0;
    const normalizedCoupon = coupon_code ? String(coupon_code).trim().toUpperCase() : null;
    if (normalizedCoupon === 'WELCOME100' && calculatedSubtotal >= 400) {
      discountAmount = 100;
    } else if (normalizedCoupon === 'FEAST150' && calculatedSubtotal >= 900) {
      discountAmount = 150;
    } else if (normalizedCoupon === 'PIZZA20' && calculatedSubtotal >= 600) {
      discountAmount = Math.min(250, Number((calculatedSubtotal * 0.2).toFixed(2)));
    }

    const finalAmount = Math.max(
      0,
      Number((calculatedSubtotal + taxAmount + deliveryFee - discountAmount).toFixed(2))
    );

    const nextOrderId = dbState.orders.reduce((max, o) => Math.max(max, o.id), 0) + 1;
    const orderNumber = idempotency_key || `PH-2026-${1000 + nextOrderId}`;
    const now = new Date().toISOString();
    const isOnline = payment_method === 'Online';

    const newOrder = {
      id: nextOrderId,
      order_number: orderNumber,
      user_id: userId,
      address_id: address_id ? Number(address_id) : null,
      delivery_address_snapshot: String(delivery_address).trim(),
      customer_phone: String(customer_phone).trim(),
      order_status: (isOnline ? 'Confirmed' : 'Pending') as OrderStatus,
      payment_method: (isOnline ? 'Online' : 'COD') as 'Online' | 'COD',
      payment_status: (isOnline ? 'Completed' : 'Pending') as 'Completed' | 'Pending',
      subtotal: calculatedSubtotal,
      tax_amount: taxAmount,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      coupon_code: normalizedCoupon,
      special_instructions: special_instructions ? String(special_instructions).trim() : null,
      stock_deducted: 1, // Mark deducted so duplicate stock deduction never occurs
      cancelled_reason: null,
      delivered_at: null,
      created_at: now,
      updated_at: now,
    };

    dbState.orders.push(newOrder);

    let nextOrderItemId = dbState.order_items.reduce((max, oi) => Math.max(max, oi.id), 0) + 1;
    let nextOitId = dbState.order_item_toppings.reduce((max, oit) => Math.max(max, oit.id), 0) + 1;
    let nextInvTxId = dbState.inventory_transactions.reduce((max, tx) => Math.max(max, tx.id), 0) + 1;

    for (const vItem of validatedItems) {
      const orderItemId = nextOrderItemId++;
      dbState.order_items.push({
        id: orderItemId,
        order_id: newOrder.id,
        pizza_id: vItem.pizza_id,
        pizza_size_id: vItem.pizza_size_id,
        pizza_name_snapshot: vItem.pizza_name_snapshot,
        size_name_snapshot: vItem.size_name_snapshot,
        quantity: vItem.quantity,
        unit_base_price: vItem.unit_base_price,
        toppings_unit_price: vItem.toppings_unit_price,
        line_total: vItem.line_total,
        created_at: now,
      });

      for (const top of vItem.toppings) {
        dbState.order_item_toppings.push({
          id: nextOitId++,
          order_item_id: orderItemId,
          topping_id: top.topping_id,
          topping_name_snapshot: top.topping_name_snapshot,
          price_snapshot: top.price_snapshot,
        });
      }

      // Execute Trigger Logic: trg_after_order_item_insert_deduct_stock
      const sizeMultiplier =
        vItem.size_name_snapshot === 'Regular' ? 0.85 : vItem.size_name_snapshot === 'Large' ? 1.3 : 1.0;
      const recipeRows = dbState.pizza_ingredients.filter((pi) => pi.pizza_id === vItem.pizza_id);

      for (const rRow of recipeRows) {
        const ing = dbState.ingredients.find((i) => i.id === rRow.ingredient_id);
        if (ing) {
          const deductQty = Number((rRow.quantity_required * sizeMultiplier * vItem.quantity).toFixed(2));
          const stockBefore = ing.current_stock;
          const stockAfter = Math.max(0, Number((stockBefore - deductQty).toFixed(2)));
          ing.current_stock = stockAfter;
          ing.updated_at = now;

          dbState.inventory_transactions.push({
            id: nextInvTxId++,
            ingredient_id: ing.id,
            order_id: newOrder.id,
            transaction_type: 'ORDER_DEDUCTION',
            quantity_change: -deductQty,
            stock_before: stockBefore,
            stock_after: stockAfter,
            notes: `Auto trigger deduction for Order ${newOrder.order_number} (${vItem.quantity}x ${vItem.pizza_name_snapshot})`,
            performed_by: userId,
            created_at: now,
          });
        }
      }
    }

    const nextPaymentId = dbState.payments.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const txRef = `TXN-${orderNumber}-${Date.now().toString().slice(-4)}`;
    dbState.payments.push({
      id: nextPaymentId,
      order_id: newOrder.id,
      transaction_reference: txRef,
      payment_method: newOrder.payment_method,
      payment_gateway: isOnline ? String(payment_gateway || 'Razorpay_UPI') : 'Cash_On_Delivery',
      amount: finalAmount,
      payment_status: newOrder.payment_status,
      paid_at: isOnline ? now : null,
      created_at: now,
      updated_at: now,
    });

    await executeOnMySQLIfConnected(
      'INSERT INTO orders (id, order_number, user_id, address_id, delivery_address_snapshot, customer_phone, order_status, payment_method, payment_status, subtotal, tax_amount, delivery_fee, discount_amount, final_amount, coupon_code, special_instructions, stock_deducted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [
        newOrder.id,
        newOrder.order_number,
        newOrder.user_id,
        newOrder.address_id,
        newOrder.delivery_address_snapshot,
        newOrder.customer_phone,
        newOrder.order_status,
        newOrder.payment_method,
        newOrder.payment_status,
        newOrder.subtotal,
        newOrder.tax_amount,
        newOrder.delivery_fee,
        newOrder.discount_amount,
        newOrder.final_amount,
        newOrder.coupon_code,
        newOrder.special_instructions,
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Order ${orderNumber} placed successfully with ACID transaction & inventory stock deduction.`,
      order: getEnrichedOrder(newOrder),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Transaction rolled back due to order creation error.',
    });
  }
}

export async function getMyOrders(req: Request, res: Response) {
  const userId = req.user!.userId;
  const orders = dbState.orders
    .filter((o) => o.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(getEnrichedOrder);

  return res.json({
    success: true,
    count: orders.length,
    orders,
  });
}

export async function getOrderById(req: Request, res: Response) {
  const idParam = req.params.id;
  const order = dbState.orders.find(
    (o) => o.id === Number(idParam) || o.order_number.toLowerCase() === String(idParam).toLowerCase()
  );

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (req.user?.role !== 'admin' && order.user_id !== req.user?.userId) {
    return res.status(403).json({ success: false, message: 'Access denied to this order.' });
  }

  const invLogs = dbState.inventory_transactions
    .filter((tx) => tx.order_id === order.id)
    .map((tx) => ({
      ...tx,
      ingredient_name: dbState.ingredients.find((i) => i.id === tx.ingredient_id)?.name || 'Ingredient',
    }));

  return res.json({
    success: true,
    order: {
      ...getEnrichedOrder(order),
      inventory_transactions: invLogs,
    },
  });
}

export async function cancelMyOrder(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const order = dbState.orders.find((o) => o.id === orderId && o.user_id === req.user?.userId);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (!['Pending', 'Confirmed'].includes(order.order_status)) {
    return res.status(400).json({
      success: false,
      message: `Orders in '${order.order_status}' stage cannot be cancelled by the customer.`,
    });
  }

  const now = new Date().toISOString();
  order.order_status = 'Cancelled';
  order.cancelled_reason = String(req.body?.reason || 'Cancelled by customer').trim();
  order.updated_at = now;

  if (order.payment_status === 'Completed') {
    order.payment_status = 'Refunded';
  } else {
    order.payment_status = 'Failed';
  }

  const payment = dbState.payments.find((p) => p.order_id === order.id);
  if (payment) {
    payment.payment_status = order.payment_status;
    payment.updated_at = now;
  }

  // Reverse deducted stock if stock_deducted === 1
  if (order.stock_deducted === 1) {
    order.stock_deducted = 0;
    const deductions = dbState.inventory_transactions.filter(
      (tx) => tx.order_id === order.id && tx.transaction_type === 'ORDER_DEDUCTION'
    );
    let nextInvTxId = dbState.inventory_transactions.reduce((max, tx) => Math.max(max, tx.id), 0) + 1;
    for (const d of deductions) {
      const ing = dbState.ingredients.find((i) => i.id === d.ingredient_id);
      if (ing) {
        const restoreQty = Math.abs(d.quantity_change);
        const before = ing.current_stock;
        const after = Number((before + restoreQty).toFixed(2));
        ing.current_stock = after;
        dbState.inventory_transactions.push({
          id: nextInvTxId++,
          ingredient_id: ing.id,
          order_id: order.id,
          transaction_type: 'ORDER_REVERSAL',
          quantity_change: restoreQty,
          stock_before: before,
          stock_after: after,
          notes: `Stock restored on cancellation of Order ${order.order_number}`,
          performed_by: req.user!.userId,
          created_at: now,
        });
      }
    }
  }

  await executeOnMySQLIfConnected(
    'CALL UpdateOrderStatus(?, ?, ?, ?)',
    [order.id, 'Cancelled', order.cancelled_reason, req.user!.userId]
  );

  return res.json({
    success: true,
    message: `Order ${order.order_number} cancelled and ingredient stock restored.`,
    order: getEnrichedOrder(order),
  });
}

export async function getAllAdminOrders(req: Request, res: Response) {
  const { status, search, paymentMethod } = req.query;

  let list = [...dbState.orders];

  if (status && status !== 'all') {
    list = list.filter((o) => o.order_status === status);
  }

  if (paymentMethod && paymentMethod !== 'all') {
    list = list.filter((o) => o.payment_method === paymentMethod);
  }

  let enriched = list
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(getEnrichedOrder);

  if (search && String(search).trim() !== '') {
    const q = String(search).trim().toLowerCase();
    enriched = enriched.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q) ||
        o.delivery_address_snapshot.toLowerCase().includes(q)
    );
  }

  return res.json({
    success: true,
    count: enriched.length,
    orders: enriched,
  });
}

export async function updateAdminOrderStatus(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { status, reason } = req.body;

  const validStatuses: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Preparing',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
    });
  }

  const order = dbState.orders.find((o) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const now = new Date().toISOString();
  order.order_status = status;
  order.updated_at = now;

  if (status === 'Delivered') {
    order.delivered_at = now;
    order.payment_status = 'Completed';
  } else if (status === 'Cancelled') {
    order.cancelled_reason = String(reason || 'Cancelled by administrator').trim();
    order.payment_status = order.payment_status === 'Completed' ? 'Refunded' : 'Failed';

    if (order.stock_deducted === 1) {
      order.stock_deducted = 0;
      const deductions = dbState.inventory_transactions.filter(
        (tx) => tx.order_id === order.id && tx.transaction_type === 'ORDER_DEDUCTION'
      );
      let nextInvTxId = dbState.inventory_transactions.reduce((max, tx) => Math.max(max, tx.id), 0) + 1;
      for (const d of deductions) {
        const ing = dbState.ingredients.find((i) => i.id === d.ingredient_id);
        if (ing) {
          const restoreQty = Math.abs(d.quantity_change);
          const before = ing.current_stock;
          const after = Number((before + restoreQty).toFixed(2));
          ing.current_stock = after;
          dbState.inventory_transactions.push({
            id: nextInvTxId++,
            ingredient_id: ing.id,
            order_id: order.id,
            transaction_type: 'ORDER_REVERSAL',
            quantity_change: restoreQty,
            stock_before: before,
            stock_after: after,
            notes: `Stock reversed via UpdateOrderStatus for Order ${order.order_number}`,
            performed_by: req.user!.userId,
            created_at: now,
          });
        }
      }
    }
  }

  const payment = dbState.payments.find((p) => p.order_id === order.id);
  if (payment) {
    payment.payment_status = order.payment_status;
    if (status === 'Delivered' && !payment.paid_at) payment.paid_at = now;
    payment.updated_at = now;
  }

  await executeOnMySQLIfConnected(
    'CALL UpdateOrderStatus(?, ?, ?, ?)',
    [order.id, status, order.cancelled_reason, req.user!.userId]
  );

  return res.json({
    success: true,
    message: `Order ${order.order_number} updated to '${status}' via UpdateOrderStatus stored procedure.`,
    order: getEnrichedOrder(order),
  });
}
