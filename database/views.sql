-- ============================================================================
-- PIZZAHUB - PIZZA MANAGEMENT SYSTEM (DBMS MINI PROJECT)
-- File: database/views.sql
-- Target DBMS: MySQL 8.0+
-- Description: Relational Database Views for Order Summary and Pizza Sales.
-- ============================================================================

USE pizzahub_db;

-- ----------------------------------------------------------------------------
-- 1. VIEW: order_summary_view
-- Consolidates Order headers, Customer details, Payment status, and Item counts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW order_summary_view AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.user_id,
  u.full_name AS customer_name,
  u.email AS customer_email,
  o.customer_phone,
  o.delivery_address_snapshot,
  o.order_status,
  o.payment_method,
  o.payment_status,
  p.transaction_reference,
  p.payment_gateway,
  COUNT(oi.id) AS distinct_line_items,
  COALESCE(SUM(oi.quantity), 0) AS total_pizza_count,
  o.subtotal,
  o.tax_amount,
  o.delivery_fee,
  o.discount_amount,
  o.final_amount,
  o.coupon_code,
  o.created_at AS order_date,
  o.delivered_at
FROM orders o
INNER JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN payments p ON o.id = p.order_id
GROUP BY
  o.id, o.order_number, o.user_id, u.full_name, u.email, o.customer_phone,
  o.delivery_address_snapshot, o.order_status, o.payment_method, o.payment_status,
  p.transaction_reference, p.payment_gateway, o.subtotal, o.tax_amount,
  o.delivery_fee, o.discount_amount, o.final_amount, o.coupon_code,
  o.created_at, o.delivered_at;

-- ----------------------------------------------------------------------------
-- 2. VIEW: pizza_sales_view
-- Aggregates total units sold, revenue, average selling price, and order frequency
-- for every pizza and category (excluding cancelled orders)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW pizza_sales_view AS
SELECT
  pz.id AS pizza_id,
  pz.name AS pizza_name,
  pz.slug AS pizza_slug,
  c.id AS category_id,
  c.name AS category_name,
  pz.is_veg,
  pz.base_price,
  pz.is_available,
  COUNT(DISTINCT CASE WHEN o.order_status <> 'Cancelled' THEN o.id END) AS total_orders_placed,
  COALESCE(SUM(CASE WHEN o.order_status <> 'Cancelled' THEN oi.quantity ELSE 0 END), 0) AS total_quantity_sold,
  COALESCE(SUM(CASE WHEN o.order_status <> 'Cancelled' THEN oi.line_total ELSE 0.00 END), 0.00) AS gross_item_revenue,
  ROUND(
    COALESCE(AVG(CASE WHEN o.order_status <> 'Cancelled' THEN (oi.unit_base_price + oi.toppings_unit_price) END), pz.base_price),
    2
  ) AS avg_unit_selling_price
FROM pizzas pz
INNER JOIN categories c ON pz.category_id = c.id
LEFT JOIN order_items oi ON pz.id = oi.pizza_id
LEFT JOIN orders o ON oi.order_id = o.id
GROUP BY
  pz.id, pz.name, pz.slug, c.id, c.name, pz.is_veg, pz.base_price, pz.is_available;
