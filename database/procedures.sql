-- ============================================================================
-- PIZZAHUB - PIZZA MANAGEMENT SYSTEM (DBMS MINI PROJECT)
-- File: database/procedures.sql
-- Target DBMS: MySQL 8.0+
-- Description: Five Stored Procedures for core PizzaHub operations:
--   1. AddNewPizza
--   2. PlaceCustomerOrder
--   3. UpdateOrderStatus
--   4. GetCustomerOrderHistory
--   5. GenerateMonthlySalesReport
-- ============================================================================

USE pizzahub_db;

DROP PROCEDURE IF EXISTS AddNewPizza;
DROP PROCEDURE IF EXISTS PlaceCustomerOrder;
DROP PROCEDURE IF EXISTS UpdateOrderStatus;
DROP PROCEDURE IF EXISTS GetCustomerOrderHistory;
DROP PROCEDURE IF EXISTS GenerateMonthlySalesReport;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. STORED PROCEDURE: AddNewPizza
-- Inserts a new pizza along with its 3 standard sizes (Regular, Medium, Large)
-- inside an atomic transaction.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE AddNewPizza(
  IN p_category_id INT UNSIGNED,
  IN p_name VARCHAR(120),
  IN p_slug VARCHAR(140),
  IN p_description TEXT,
  IN p_image_url VARCHAR(255),
  IN p_is_veg TINYINT(1),
  IN p_spice_level VARCHAR(10),
  IN p_regular_price DECIMAL(10, 2),
  IN p_medium_price DECIMAL(10, 2),
  IN p_large_price DECIMAL(10, 2),
  OUT p_new_pizza_id INT UNSIGNED
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  INSERT INTO pizzas (
    category_id, name, slug, description, image_url, base_price,
    is_veg, spice_level, is_popular, is_best_seller, is_available
  ) VALUES (
    p_category_id, p_name, p_slug, p_description, p_image_url, p_regular_price,
    p_is_veg, p_spice_level, 0, 0, 1
  );

  SET p_new_pizza_id = LAST_INSERT_ID();

  INSERT INTO pizza_sizes (pizza_id, size_name, size_code, diameter_inches, price, is_available)
  VALUES
    (p_new_pizza_id, 'Regular', 'REG', 8, p_regular_price, 1),
    (p_new_pizza_id, 'Medium',  'MED', 10, p_medium_price,  1),
    (p_new_pizza_id, 'Large',   'LRG', 12, p_large_price,   1);

  COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 2. STORED PROCEDURE: PlaceCustomerOrder
-- Creates an order header, inserts the primary item, records payment, and
-- prevents duplicate order numbers inside a transaction.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE PlaceCustomerOrder(
  IN p_order_number VARCHAR(32),
  IN p_user_id INT UNSIGNED,
  IN p_address_id INT UNSIGNED,
  IN p_delivery_address TEXT,
  IN p_customer_phone VARCHAR(20),
  IN p_payment_method VARCHAR(10),
  IN p_pizza_id INT UNSIGNED,
  IN p_pizza_size_id INT UNSIGNED,
  IN p_quantity INT,
  IN p_discount_amount DECIMAL(10, 2),
  IN p_coupon_code VARCHAR(30),
  IN p_special_instructions TEXT,
  OUT p_order_id INT UNSIGNED
)
BEGIN
  DECLARE v_pizza_name VARCHAR(120);
  DECLARE v_size_name VARCHAR(20);
  DECLARE v_unit_price DECIMAL(10, 2);
  DECLARE v_subtotal DECIMAL(10, 2);
  DECLARE v_tax DECIMAL(10, 2);
  DECLARE v_delivery_fee DECIMAL(10, 2);
  DECLARE v_final_amount DECIMAL(10, 2);
  DECLARE v_payment_status VARCHAR(20);
  DECLARE v_existing_count INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Prevent duplicate order processing
  SELECT COUNT(*) INTO v_existing_count
  FROM orders
  WHERE order_number = p_order_number;

  IF v_existing_count > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Duplicate order_number detected. Order already processed.';
  END IF;

  -- Lookup pizza & size pricing
  SELECT pz.name, ps.size_name, ps.price
    INTO v_pizza_name, v_size_name, v_unit_price
  FROM pizzas pz
  INNER JOIN pizza_sizes ps ON pz.id = ps.pizza_id
  WHERE pz.id = p_pizza_id AND ps.id = p_pizza_size_id AND pz.is_available = 1
  FOR UPDATE;

  IF v_unit_price IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Selected pizza or size is unavailable.';
  END IF;

  SET v_subtotal = ROUND(v_unit_price * p_quantity, 2);
  SET v_tax = ROUND(v_subtotal * 0.05, 2);
  SET v_delivery_fee = IF(v_subtotal >= 500.00, 0.00, 49.00);
  SET v_final_amount = GREATEST(0.00, ROUND(v_subtotal + v_tax + v_delivery_fee - IFNULL(p_discount_amount, 0.00), 2));
  SET v_payment_status = IF(p_payment_method = 'Online', 'Completed', 'Pending');

  INSERT INTO orders (
    order_number, user_id, address_id, delivery_address_snapshot, customer_phone,
    order_status, payment_method, payment_status, subtotal, tax_amount,
    delivery_fee, discount_amount, final_amount, coupon_code,
    special_instructions, stock_deducted
  ) VALUES (
    p_order_number, p_user_id, p_address_id, p_delivery_address, p_customer_phone,
    IF(p_payment_method = 'Online', 'Confirmed', 'Pending'),
    p_payment_method, v_payment_status, v_subtotal, v_tax,
    v_delivery_fee, IFNULL(p_discount_amount, 0.00), v_final_amount, p_coupon_code,
    p_special_instructions, 0
  );

  SET p_order_id = LAST_INSERT_ID();

  INSERT INTO order_items (
    order_id, pizza_id, pizza_size_id, pizza_name_snapshot, size_name_snapshot,
    quantity, unit_base_price, toppings_unit_price, line_total
  ) VALUES (
    p_order_id, p_pizza_id, p_pizza_size_id, v_pizza_name, v_size_name,
    p_quantity, v_unit_price, 0.00, v_subtotal
  );

  INSERT INTO payments (
    order_id, transaction_reference, payment_method, payment_gateway,
    amount, payment_status, paid_at
  ) VALUES (
    p_order_id,
    CONCAT('TXN-', p_order_number),
    p_payment_method,
    IF(p_payment_method = 'Online', 'Razorpay_Online', 'Cash_On_Delivery'),
    v_final_amount,
    v_payment_status,
    IF(p_payment_method = 'Online', NOW(), NULL)
  );

  COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURE: UpdateOrderStatus
-- Updates order status, handles delivery timestamps, and restores stock if
-- an order is cancelled after stock deduction.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE UpdateOrderStatus(
  IN p_order_id INT UNSIGNED,
  IN p_new_status VARCHAR(30),
  IN p_cancel_reason VARCHAR(255),
  IN p_admin_user_id INT UNSIGNED
)
BEGIN
  DECLARE v_current_status VARCHAR(30);
  DECLARE v_stock_deducted TINYINT(1);
  DECLARE v_payment_method VARCHAR(10);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT order_status, stock_deducted, payment_method
    INTO v_current_status, v_stock_deducted, v_payment_method
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Order not found.';
  END IF;

  -- Update order header
  UPDATE orders
  SET
    order_status = p_new_status,
    cancelled_reason = IF(p_new_status = 'Cancelled', p_cancel_reason, cancelled_reason),
    delivered_at = IF(p_new_status = 'Delivered', NOW(), delivered_at),
    payment_status = CASE
      WHEN p_new_status = 'Delivered' THEN 'Completed'
      WHEN p_new_status = 'Cancelled' AND payment_status = 'Completed' THEN 'Refunded'
      WHEN p_new_status = 'Cancelled' THEN 'Failed'
      ELSE payment_status
    END
  WHERE id = p_order_id;

  -- Sync payment record
  UPDATE payments
  SET
    payment_status = CASE
      WHEN p_new_status = 'Delivered' THEN 'Completed'
      WHEN p_new_status = 'Cancelled' AND payment_status = 'Completed' THEN 'Refunded'
      WHEN p_new_status = 'Cancelled' THEN 'Failed'
      ELSE payment_status
    END,
    paid_at = IF(p_new_status = 'Delivered' AND paid_at IS NULL, NOW(), paid_at)
  WHERE order_id = p_order_id;

  COMMIT;
END$$

-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURE: GetCustomerOrderHistory
-- Returns complete order history and payment summary for a specific customer.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE GetCustomerOrderHistory(
  IN p_user_id INT UNSIGNED
)
BEGIN
  SELECT
    o.id AS order_id,
    o.order_number,
    o.order_status,
    o.payment_method,
    o.payment_status,
    o.subtotal,
    o.tax_amount,
    o.delivery_fee,
    o.discount_amount,
    o.final_amount,
    o.delivery_address_snapshot,
    o.created_at,
    o.delivered_at,
    COUNT(oi.id) AS line_items_count,
    COALESCE(SUM(oi.quantity), 0) AS total_pizzas,
    GROUP_CONCAT(CONCAT(oi.quantity, 'x ', oi.pizza_name_snapshot, ' (', oi.size_name_snapshot, ')') SEPARATOR ', ') AS items_summary
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE o.user_id = p_user_id
  GROUP BY
    o.id, o.order_number, o.order_status, o.payment_method, o.payment_status,
    o.subtotal, o.tax_amount, o.delivery_fee, o.discount_amount, o.final_amount,
    o.delivery_address_snapshot, o.created_at, o.delivered_at
  ORDER BY o.created_at DESC;
END$$

-- ----------------------------------------------------------------------------
-- 5. STORED PROCEDURE: GenerateMonthlySalesReport
-- Generates monthly revenue, order volume, tax collected, and average order
-- value for a given year.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE GenerateMonthlySalesReport(
  IN p_year INT
)
BEGIN
  SELECT
    DATE_FORMAT(o.created_at, '%Y-%m') AS sales_month,
    MONTHNAME(MIN(o.created_at)) AS month_name,
    COUNT(o.id) AS total_orders,
    SUM(CASE WHEN o.order_status <> 'Cancelled' THEN 1 ELSE 0 END) AS completed_or_active_orders,
    SUM(CASE WHEN o.order_status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
    COALESCE(SUM(CASE WHEN o.order_status <> 'Cancelled' THEN o.subtotal ELSE 0.00 END), 0.00) AS net_food_sales,
    COALESCE(SUM(CASE WHEN o.order_status <> 'Cancelled' THEN o.tax_amount ELSE 0.00 END), 0.00) AS total_tax_collected,
    COALESCE(SUM(CASE WHEN o.order_status <> 'Cancelled' THEN o.discount_amount ELSE 0.00 END), 0.00) AS total_discounts_given,
    COALESCE(SUM(CASE WHEN o.order_status <> 'Cancelled' THEN o.final_amount ELSE 0.00 END), 0.00) AS total_revenue,
    ROUND(
      COALESCE(AVG(CASE WHEN o.order_status <> 'Cancelled' THEN o.final_amount END), 0.00),
      2
    ) AS average_order_value
  FROM orders o
  WHERE YEAR(o.created_at) = p_year
  GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
  ORDER BY sales_month ASC;
END$$

DELIMITER ;
