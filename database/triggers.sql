-- ============================================================================
-- PIZZAHUB - PIZZA MANAGEMENT SYSTEM (DBMS MINI PROJECT)
-- File: database/triggers.sql
-- Target DBMS: MySQL 8.0+
-- Description: Database Triggers for automatic Inventory Stock Deduction and
--              Inventory Transaction Audit Logging with duplicate prevention.
-- ============================================================================

USE pizzahub_db;

DROP TRIGGER IF EXISTS trg_after_order_item_insert_deduct_stock;
DROP TRIGGER IF EXISTS trg_after_ingredient_update_log_transaction;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. TRIGGER: trg_after_order_item_insert_deduct_stock
-- Automatically deducts recipe ingredients from `ingredients.current_stock`
-- and logs `ORDER_DEDUCTION` rows in `inventory_transactions` when a new
-- order_item is inserted (only if orders.stock_deducted = 0 to prevent
-- duplicate stock deduction).
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_after_order_item_insert_deduct_stock
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  DECLARE v_already_deducted TINYINT(1) DEFAULT 0;
  DECLARE v_order_number VARCHAR(32);
  DECLARE v_size_multiplier DECIMAL(4, 2) DEFAULT 1.00;

  SELECT stock_deducted, order_number
    INTO v_already_deducted, v_order_number
  FROM orders
  WHERE id = NEW.order_id;

  SET v_size_multiplier = CASE NEW.size_name_snapshot
    WHEN 'Regular' THEN 0.85
    WHEN 'Medium'  THEN 1.00
    WHEN 'Large'   THEN 1.30
    ELSE 1.00
  END;

  -- Only deduct stock if the order header wasn't already marked as pre-deducted
  IF v_already_deducted = 0 THEN
    -- Log inventory transactions prior to stock update
    INSERT INTO inventory_transactions (
      ingredient_id,
      order_id,
      transaction_type,
      quantity_change,
      stock_before,
      stock_after,
      notes
    )
    SELECT
      pi.ingredient_id,
      NEW.order_id,
      'ORDER_DEDUCTION',
      ROUND(-1 * (pi.quantity_required * v_size_multiplier * NEW.quantity), 2),
      ing.current_stock,
      GREATEST(0.00, ROUND(ing.current_stock - (pi.quantity_required * v_size_multiplier * NEW.quantity), 2)),
      CONCAT('Auto trigger deduction for Order ', v_order_number, ' (', NEW.quantity, 'x ', NEW.pizza_name_snapshot, ')')
    FROM pizza_ingredients pi
    INNER JOIN ingredients ing ON pi.ingredient_id = ing.id
    WHERE pi.pizza_id = NEW.pizza_id;

    -- Deduct stock from ingredients table
    UPDATE ingredients ing
    INNER JOIN pizza_ingredients pi ON ing.id = pi.ingredient_id
    SET ing.current_stock = GREATEST(0.00, ROUND(ing.current_stock - (pi.quantity_required * v_size_multiplier * NEW.quantity), 2))
    WHERE pi.pizza_id = NEW.pizza_id;
  END IF;
END$$

-- ----------------------------------------------------------------------------
-- 2. TRIGGER: trg_after_ingredient_update_log_transaction
-- Automatically writes an audit log to `inventory_transactions` whenever an
-- administrator manually restocks or adjusts `ingredients.current_stock`
-- outside of an order deduction.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_after_ingredient_update_log_transaction
AFTER UPDATE ON ingredients
FOR EACH ROW
BEGIN
  DECLARE v_diff DECIMAL(10, 2);
  DECLARE v_recent_order_tx INT DEFAULT 0;

  SET v_diff = ROUND(NEW.current_stock - OLD.current_stock, 2);

  IF v_diff <> 0.00 THEN
    -- Check if an order deduction transaction was just logged in the same second
    SELECT COUNT(*) INTO v_recent_order_tx
    FROM inventory_transactions
    WHERE ingredient_id = NEW.id
      AND stock_before = OLD.current_stock
      AND stock_after = NEW.current_stock
      AND created_at >= (NOW() - INTERVAL 2 SECOND);

    IF v_recent_order_tx = 0 THEN
      INSERT INTO inventory_transactions (
        ingredient_id,
        order_id,
        transaction_type,
        quantity_change,
        stock_before,
        stock_after,
        notes
      ) VALUES (
        NEW.id,
        NULL,
        IF(v_diff > 0, 'RESTOCK', 'ADJUSTMENT'),
        v_diff,
        OLD.current_stock,
        NEW.current_stock,
        IF(v_diff > 0, 'Automated trigger log: Ingredient restocked', 'Automated trigger log: Stock level adjusted')
      );
    END IF;
  END IF;
END$$

DELIMITER ;
