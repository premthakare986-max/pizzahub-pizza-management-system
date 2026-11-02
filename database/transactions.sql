-- ============================================================================
-- PIZZAHUB - PIZZA MANAGEMENT SYSTEM (DBMS MINI PROJECT)
-- File: database/transactions.sql
-- Target DBMS: MySQL 8.0+
-- Description: Demonstrates ACID Transactions (START TRANSACTION, COMMIT,
--              SAVEPOINT, and ROLLBACK) for Order Creation & Stock Validation.
-- ============================================================================

USE pizzahub_db;

-- ============================================================================
-- SCENARIO 1: SUCCESSFUL ATOMIC ORDER CREATION WITH COMMIT
-- Demonstrates locking ingredient stock rows with FOR UPDATE, creating order
-- header, inserting line items, recording payment, and committing atomically.
-- ============================================================================

START TRANSACTION;

-- Step 1: Verify customer and lock required ingredient rows
SELECT id, name, current_stock
FROM ingredients
WHERE id IN (1, 2, 3, 10)
FOR UPDATE;

-- Step 2: Insert Order Header
INSERT INTO orders (
  order_number, user_id, address_id, delivery_address_snapshot, customer_phone,
  order_status, payment_method, payment_status, subtotal, tax_amount,
  delivery_fee, discount_amount, final_amount, special_instructions, stock_deducted
) VALUES (
  'PH-2026-TX-DEMO1', 2, 1,
  'Flat 402, Emerald Heights, Linking Road, Bandra West, Mumbai 400050',
  '+91-9876543210', 'Confirmed', 'Online', 'Completed',
  449.00, 22.45, 49.00, 0.00, 520.45,
  'ACID Transaction Commit Demo Order', 1
);

SET @tx_order_id = LAST_INSERT_ID();

-- Step 3: Insert Order Item
INSERT INTO order_items (
  order_id, pizza_id, pizza_size_id, pizza_name_snapshot, size_name_snapshot,
  quantity, unit_base_price, toppings_unit_price, line_total
) VALUES (
  @tx_order_id, 1, 2, 'Margherita Classica DOP', 'Medium',
  1, 449.00, 0.00, 449.00
);

-- Step 4: Deduct stock and record inventory transaction
UPDATE ingredients SET current_stock = current_stock - 0.25 WHERE id = 1;
UPDATE ingredients SET current_stock = current_stock - 0.15 WHERE id = 3;

-- Step 5: Insert Payment Record
INSERT INTO payments (
  order_id, transaction_reference, payment_method, payment_gateway,
  amount, payment_status, paid_at
) VALUES (
  @tx_order_id, 'TXN-PH-DEMO-COMMIT-01', 'Online', 'Razorpay_UPI',
  520.45, 'Completed', NOW()
);

-- Commit all changes permanently
COMMIT;


-- ============================================================================
-- SCENARIO 2: FAILED ORDER / INSUFFICIENT STOCK DEMONSTRATING ROLLBACK
-- Demonstrates starting a transaction, inserting an order, detecting an invalid
-- payment or stock condition, and issuing ROLLBACK so zero partial records remain.
-- ============================================================================

START TRANSACTION;

INSERT INTO orders (
  order_number, user_id, address_id, delivery_address_snapshot, customer_phone,
  order_status, payment_method, payment_status, subtotal, tax_amount,
  delivery_fee, discount_amount, final_amount, special_instructions, stock_deducted
) VALUES (
  'PH-2026-TX-ROLLBACK', 3, 3,
  'Villa 14, Palm Meadows, Whitefield Main Road, Bengaluru 560066',
  '+91-9811223344', 'Pending', 'Online', 'Failed',
  899.00, 44.95, 0.00, 0.00, 943.95,
  'This order will be rolled back due to simulated gateway timeout', 0
);

SET @rollback_order_id = LAST_INSERT_ID();

INSERT INTO order_items (
  order_id, pizza_id, pizza_size_id, pizza_name_snapshot, size_name_snapshot,
  quantity, unit_base_price, toppings_unit_price, line_total
) VALUES (
  @rollback_order_id, 5, 15, 'Black Truffle & Wild Mushroom', 'Large',
  1, 899.00, 0.00, 899.00
);

-- Simulate payment gateway failure or stock shortfall -> Abort & Rollback!
ROLLBACK;

-- Verification query confirming rolled-back order was NOT persisted:
SELECT COUNT(*) AS rolled_back_order_exists
FROM orders
WHERE order_number = 'PH-2026-TX-ROLLBACK';
