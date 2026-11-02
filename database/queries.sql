-- ============================================================================
-- PIZZAHUB - PIZZA MANAGEMENT SYSTEM (DBMS MINI PROJECT)
-- File: database/queries.sql
-- Target DBMS: MySQL 8.0+
-- Description: 24 Executable SQL Queries demonstrating SELECT, INSERT, UPDATE,
--              DELETE, WHERE, ORDER BY, DISTINCT, GROUP BY, HAVING, INNER JOIN,
--              LEFT JOIN, RIGHT JOIN, COUNT, SUM, AVG, MIN, MAX, and Subqueries.
-- ============================================================================

USE pizzahub_db;

-- ----------------------------------------------------------------------------
-- Q1. [SELECT + WHERE + ORDER BY]
-- Retrieve all available Vegetarian Pizzas ordered by base price ascending.
-- ----------------------------------------------------------------------------
SELECT id, name, spice_level, base_price, prep_time_mins, calories
FROM pizzas
WHERE is_veg = 1 AND is_available = 1
ORDER BY base_price ASC;

-- ----------------------------------------------------------------------------
-- Q2. [DISTINCT]
-- List all distinct cities where PizzaHub customers have registered delivery addresses.
-- ----------------------------------------------------------------------------
SELECT DISTINCT city, state
FROM addresses
ORDER BY state ASC, city ASC;

-- ----------------------------------------------------------------------------
-- Q3. [INNER JOIN + WHERE + ORDER BY]
-- Fetch all pizzas along with their category name and Medium size price.
-- ----------------------------------------------------------------------------
SELECT
  p.id AS pizza_id,
  p.name AS pizza_name,
  c.name AS category_name,
  p.is_veg,
  ps.size_name,
  ps.diameter_inches,
  ps.price AS medium_price
FROM pizzas p
INNER JOIN categories c ON p.category_id = c.id
INNER JOIN pizza_sizes ps ON p.id = ps.pizza_id
WHERE ps.size_name = 'Medium'
ORDER BY c.display_order ASC, ps.price DESC;

-- ----------------------------------------------------------------------------
-- Q4. [LEFT JOIN + COUNT + SUM + GROUP BY]
-- Customer-wise order summary including customers who have placed zero orders.
-- ----------------------------------------------------------------------------
SELECT
  u.id AS customer_id,
  u.full_name,
  u.email,
  u.phone,
  COUNT(o.id) AS total_orders,
  COALESCE(SUM(CASE WHEN o.order_status <> 'Cancelled' THEN o.final_amount ELSE 0 END), 0.00) AS lifetime_spend
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.role = 'customer'
GROUP BY u.id, u.full_name, u.email, u.phone
ORDER BY lifetime_spend DESC;

-- ----------------------------------------------------------------------------
-- Q5. [RIGHT JOIN]
-- Verify all pizza categories and list their associated pizzas (showing categories
-- even if no pizzas exist in that category).
-- ----------------------------------------------------------------------------
SELECT
  c.id AS category_id,
  c.name AS category_name,
  p.id AS pizza_id,
  p.name AS pizza_name,
  p.base_price
FROM pizzas p
RIGHT JOIN categories c ON p.category_id = c.id
ORDER BY c.display_order ASC, p.name ASC;

-- ----------------------------------------------------------------------------
-- Q6. [GROUP BY + HAVING + SUM + COUNT]
-- Identify high-performing pizza categories that have generated more than
-- Rs. 2,000 in line-item revenue.
-- ----------------------------------------------------------------------------
SELECT
  c.name AS category_name,
  COUNT(DISTINCT oi.order_id) AS orders_containing_category,
  SUM(oi.quantity) AS total_pizzas_sold,
  SUM(oi.line_total) AS category_revenue
FROM categories c
INNER JOIN pizzas p ON c.id = p.category_id
INNER JOIN order_items oi ON p.id = oi.pizza_id
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.order_status <> 'Cancelled'
GROUP BY c.id, c.name
HAVING SUM(oi.line_total) > 2000.00
ORDER BY category_revenue DESC;

-- ----------------------------------------------------------------------------
-- Q7. [AGGREGATES: COUNT, SUM, AVG, MIN, MAX]
-- Executive financial summary across all non-cancelled orders.
-- ----------------------------------------------------------------------------
SELECT
  COUNT(id) AS valid_orders_count,
  SUM(final_amount) AS total_revenue,
  ROUND(AVG(final_amount), 2) AS average_order_value,
  MIN(final_amount) AS smallest_order_amount,
  MAX(final_amount) AS largest_order_amount,
  SUM(tax_amount) AS total_gst_collected,
  SUM(discount_amount) AS total_promotional_discounts
FROM orders
WHERE order_status <> 'Cancelled';

-- ----------------------------------------------------------------------------
-- Q8. [SUBQUERY IN WHERE CLAUSE]
-- Find all pizzas whose base price is higher than the average base price of
-- all pizzas in the catalog.
-- ----------------------------------------------------------------------------
SELECT id, name, base_price, spice_level
FROM pizzas
WHERE base_price > (
  SELECT AVG(base_price) FROM pizzas
)
ORDER BY base_price DESC;

-- ----------------------------------------------------------------------------
-- Q9. [CORRELATED SUBQUERY]
-- Find customers whose total lifetime spend exceeds the average lifetime spend
-- across all active customers.
-- ----------------------------------------------------------------------------
SELECT
  u.id,
  u.full_name,
  u.email,
  (
    SELECT COALESCE(SUM(o.final_amount), 0)
    FROM orders o
    WHERE o.user_id = u.id AND o.order_status <> 'Cancelled'
  ) AS customer_total_spend
FROM users u
WHERE u.role = 'customer'
HAVING customer_total_spend > (
  SELECT AVG(cust_totals.total_spent)
  FROM (
    SELECT COALESCE(SUM(o2.final_amount), 0) AS total_spent
    FROM users u2
    LEFT JOIN orders o2 ON u2.id = o2.user_id AND o2.order_status <> 'Cancelled'
    WHERE u2.role = 'customer'
    GROUP BY u2.id
  ) AS cust_totals
)
ORDER BY customer_total_spend DESC;

-- ----------------------------------------------------------------------------
-- Q10. [LOW STOCK ALERT QUERY - WHERE COMPARISON]
-- Retrieve all kitchen ingredients where current_stock is at or below the
-- minimum reorder threshold.
-- ----------------------------------------------------------------------------
SELECT
  id,
  sku,
  name,
  unit,
  current_stock,
  min_reorder_level,
  ROUND(min_reorder_level - current_stock, 2) AS shortage_qty,
  cost_per_unit,
  supplier_name
FROM ingredients
WHERE current_stock <= min_reorder_level
ORDER BY (current_stock / min_reorder_level) ASC;

-- ----------------------------------------------------------------------------
-- Q11. [MULTI-TABLE INNER JOIN (4 TABLES)]
-- Detailed Bill of Materials (recipe cost breakdown) per pizza.
-- ----------------------------------------------------------------------------
SELECT
  p.name AS pizza_name,
  c.name AS category_name,
  COUNT(pi.ingredient_id) AS ingredient_count,
  ROUND(SUM(pi.quantity_required * i.cost_per_unit), 2) AS estimated_raw_food_cost,
  p.base_price AS regular_selling_price,
  ROUND(p.base_price - SUM(pi.quantity_required * i.cost_per_unit), 2) AS gross_margin_per_pizza
FROM pizzas p
INNER JOIN categories c ON p.category_id = c.id
INNER JOIN pizza_ingredients pi ON p.id = pi.pizza_id
INNER JOIN ingredients i ON pi.ingredient_id = i.id
GROUP BY p.id, p.name, c.name, p.base_price
ORDER BY gross_margin_per_pizza DESC;

-- ----------------------------------------------------------------------------
-- Q12. [TOP 5 BEST-SELLING PIZZAS BY QUANTITY & REVENUE]
-- Rank the top 5 most popular pizzas based on actual order items sold.
-- ----------------------------------------------------------------------------
SELECT
  p.id,
  p.name AS pizza_name,
  c.name AS category_name,
  SUM(oi.quantity) AS total_units_sold,
  SUM(oi.line_total) AS total_sales_amount
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
INNER JOIN pizzas p ON oi.pizza_id = p.id
INNER JOIN categories c ON p.category_id = c.id
WHERE o.order_status <> 'Cancelled'
GROUP BY p.id, p.name, c.name
ORDER BY total_units_sold DESC, total_sales_amount DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- Q13. [ORDER STATUS DISTRIBUTION REPORT]
-- Count and percentage breakdown of orders by current order_status.
-- ----------------------------------------------------------------------------
SELECT
  order_status,
  COUNT(*) AS order_count,
  SUM(final_amount) AS total_value,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) AS percentage_share
FROM orders
GROUP BY order_status
ORDER BY order_count DESC;

-- ----------------------------------------------------------------------------
-- Q14. [PAYMENT METHOD & GATEWAY RECONCILIATION]
-- Breakdown of payments by payment_method and payment_status.
-- ----------------------------------------------------------------------------
SELECT
  payment_method,
  payment_gateway,
  payment_status,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_processed_amount
FROM payments
GROUP BY payment_method, payment_gateway, payment_status
ORDER BY total_processed_amount DESC;

-- ----------------------------------------------------------------------------
-- Q15. [MONTHLY REVENUE TREND ANALYSIS]
-- Aggregate monthly order counts and revenue for time-series charting.
-- ----------------------------------------------------------------------------
SELECT
  DATE_FORMAT(created_at, '%Y-%m') AS month_bucket,
  DATE_FORMAT(MIN(created_at), '%b %Y') AS month_label,
  COUNT(id) AS total_orders,
  SUM(CASE WHEN order_status <> 'Cancelled' THEN final_amount ELSE 0 END) AS net_revenue
FROM orders
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month_bucket ASC;

-- ----------------------------------------------------------------------------
-- Q16. [POPULAR EXTRA TOPPINGS REPORT]
-- Analyze which custom extra toppings are ordered most frequently.
-- ----------------------------------------------------------------------------
SELECT
  t.id AS topping_id,
  t.name AS topping_name,
  t.category,
  t.price AS current_price,
  COUNT(oit.id) AS times_added,
  COALESCE(SUM(oit.price_snapshot), 0.00) AS topping_revenue
FROM toppings t
LEFT JOIN order_item_toppings oit ON t.id = oit.topping_id
GROUP BY t.id, t.name, t.category, t.price
ORDER BY times_added DESC, topping_revenue DESC;

-- ----------------------------------------------------------------------------
-- Q17. [INVENTORY VALUATION & STOCK HEALTH REPORT]
-- Compute total inventory asset value per ingredient in the kitchen.
-- ----------------------------------------------------------------------------
SELECT
  sku,
  name AS ingredient_name,
  current_stock,
  unit,
  cost_per_unit,
  ROUND(current_stock * cost_per_unit, 2) AS stock_valuation_inr,
  CASE
    WHEN current_stock <= min_reorder_level THEN 'CRITICAL_LOW'
    WHEN current_stock <= (min_reorder_level * 1.5) THEN 'MODERATE'
    ELSE 'HEALTHY'
  END AS stock_health_status
FROM ingredients
ORDER BY stock_valuation_inr DESC;

-- ----------------------------------------------------------------------------
-- Q18. [INSERT OPERATION]
-- Insert a new seasonal promotional topping (Roasted Pine Nuts).
-- ----------------------------------------------------------------------------
INSERT INTO toppings (name, category, price, is_veg, is_available)
VALUES ('Toasted Mediterranean Pine Nuts', 'Herb & Spice', 80.00, 1, 1)
ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- Q19. [UPDATE OPERATION]
-- Restock Umbrian Black Truffle Paste by +5.00 kg and update last_restocked_at.
-- ----------------------------------------------------------------------------
UPDATE ingredients
SET
  current_stock = current_stock + 5.00,
  last_restocked_at = CURRENT_TIMESTAMP
WHERE sku = 'ING-TRF-005';

-- ----------------------------------------------------------------------------
-- Q20. [DELETE OPERATION]
-- Safely remove any unreferenced promotional topping that has never been ordered.
-- ----------------------------------------------------------------------------
DELETE FROM toppings
WHERE name = 'Toasted Mediterranean Pine Nuts'
  AND id NOT IN (SELECT DISTINCT topping_id FROM order_item_toppings);

-- ----------------------------------------------------------------------------
-- Q21. [SIZE PREFERENCE ANALYTICS]
-- Compare customer demand across Regular, Medium, and Large pizza sizes.
-- ----------------------------------------------------------------------------
SELECT
  oi.size_name_snapshot AS pizza_size,
  SUM(oi.quantity) AS units_sold,
  SUM(oi.line_total) AS revenue_generated,
  ROUND(AVG(oi.unit_base_price), 2) AS avg_size_price
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.order_status <> 'Cancelled'
GROUP BY oi.size_name_snapshot
ORDER BY revenue_generated DESC;

-- ----------------------------------------------------------------------------
-- Q22. [VEG VS NON-VEG SALES SPLIT]
-- Compare total sales volume and revenue between Vegetarian and Non-Vegetarian pizzas.
-- ----------------------------------------------------------------------------
SELECT
  CASE WHEN p.is_veg = 1 THEN 'Vegetarian' ELSE 'Non-Vegetarian' END AS dietary_segment,
  COUNT(DISTINCT p.id) AS catalog_pizzas_count,
  COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
  COALESCE(SUM(oi.line_total), 0.00) AS segment_revenue
FROM pizzas p
LEFT JOIN order_items oi ON p.id = oi.pizza_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.order_status <> 'Cancelled'
GROUP BY p.is_veg;
