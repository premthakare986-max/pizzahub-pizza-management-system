-- ============================================================================
-- PIZZAHUB - PIZZA MANAGEMENT SYSTEM (DBMS MINI PROJECT)
-- File: database/schema.sql
-- Target DBMS: MySQL 8.0+
-- Description: Complete Relational Database Schema with 14 normalized tables,
--              Primary Keys, Foreign Keys, CHECK/UNIQUE constraints, and Indexes.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS pizzahub_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pizzahub_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_item_toppings;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS pizza_ingredients;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS pizza_toppings;
DROP TABLE IF EXISTS toppings;
DROP TABLE IF EXISTS pizza_sizes;
DROP TABLE IF EXISTS pizzas;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (Customers & Administrators)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES TABLE (Pizza Categories)
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(90) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  display_order INT NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_order (display_order, is_active)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. PIZZAS TABLE (Core Catalog)
-- ----------------------------------------------------------------------------
CREATE TABLE pizzas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  is_veg TINYINT(1) NOT NULL DEFAULT 1,
  spice_level ENUM('Mild', 'Medium', 'Hot') NOT NULL DEFAULT 'Mild',
  is_popular TINYINT(1) NOT NULL DEFAULT 0,
  is_best_seller TINYINT(1) NOT NULL DEFAULT 0,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  prep_time_mins INT NOT NULL DEFAULT 18,
  calories INT NOT NULL DEFAULT 720,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pizzas_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_pizzas_category (category_id),
  INDEX idx_pizzas_veg_avail (is_veg, is_available),
  INDEX idx_pizzas_popular (is_popular, is_best_seller),
  INDEX idx_pizzas_price (base_price)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. PIZZA_SIZES TABLE (Regular / Medium / Large pricing per Pizza)
-- ----------------------------------------------------------------------------
CREATE TABLE pizza_sizes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pizza_id INT UNSIGNED NOT NULL,
  size_name ENUM('Regular', 'Medium', 'Large') NOT NULL,
  size_code VARCHAR(10) NOT NULL,
  diameter_inches INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_pizza_size UNIQUE (pizza_id, size_name),
  CONSTRAINT fk_pizza_sizes_pizza
    FOREIGN KEY (pizza_id) REFERENCES pizzas(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_pizza_sizes_lookup (pizza_id, is_available)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. TOPPINGS TABLE (Extra Customizations)
-- ----------------------------------------------------------------------------
CREATE TABLE toppings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  category ENUM('Veg', 'Non-Veg', 'Cheese', 'Herb & Spice') NOT NULL DEFAULT 'Veg',
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  is_veg TINYINT(1) NOT NULL DEFAULT 1,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_toppings_veg_avail (is_veg, is_available)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. PIZZA_TOPPINGS TABLE (M:N Mapping of Default/Recommended Toppings per Pizza)
-- ----------------------------------------------------------------------------
CREATE TABLE pizza_toppings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pizza_id INT UNSIGNED NOT NULL,
  topping_id INT UNSIGNED NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_pizza_topping UNIQUE (pizza_id, topping_id),
  CONSTRAINT fk_pt_pizza
    FOREIGN KEY (pizza_id) REFERENCES pizzas(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pt_topping
    FOREIGN KEY (topping_id) REFERENCES toppings(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. ADDRESSES TABLE (Customer Delivery Locations)
-- ----------------------------------------------------------------------------
CREATE TABLE addresses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  label VARCHAR(50) NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  landmark VARCHAR(150) DEFAULT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id, is_default)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. INGREDIENTS TABLE (Kitchen Raw Material Inventory)
-- ----------------------------------------------------------------------------
CREATE TABLE ingredients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  sku VARCHAR(40) NOT NULL UNIQUE,
  unit VARCHAR(20) NOT NULL,
  current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (current_stock >= 0),
  min_reorder_level DECIMAL(10, 2) NOT NULL DEFAULT 10.00 CHECK (min_reorder_level >= 0),
  cost_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_per_unit >= 0),
  supplier_name VARCHAR(120) NOT NULL,
  last_restocked_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ingredients_stock (current_stock, min_reorder_level)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. PIZZA_INGREDIENTS TABLE (Recipe Bill of Materials per Pizza)
-- ----------------------------------------------------------------------------
CREATE TABLE pizza_ingredients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pizza_id INT UNSIGNED NOT NULL,
  ingredient_id INT UNSIGNED NOT NULL,
  quantity_required DECIMAL(10, 2) NOT NULL CHECK (quantity_required > 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_pizza_ingredient UNIQUE (pizza_id, ingredient_id),
  CONSTRAINT fk_pi_pizza
    FOREIGN KEY (pizza_id) REFERENCES pizzas(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pi_ingredient
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. ORDERS TABLE (Customer Order Headers)
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  address_id INT UNSIGNED NULL,
  delivery_address_snapshot TEXT NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  order_status ENUM('Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  payment_method ENUM('COD', 'Online') NOT NULL DEFAULT 'COD',
  payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10, 2) NOT NULL CHECK (tax_amount >= 0),
  delivery_fee DECIMAL(10, 2) NOT NULL CHECK (delivery_fee >= 0),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  final_amount DECIMAL(10, 2) NOT NULL CHECK (final_amount >= 0),
  coupon_code VARCHAR(30) DEFAULT NULL,
  special_instructions TEXT DEFAULT NULL,
  stock_deducted TINYINT(1) NOT NULL DEFAULT 0,
  cancelled_reason VARCHAR(255) DEFAULT NULL,
  delivered_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_address
    FOREIGN KEY (address_id) REFERENCES addresses(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (order_status),
  INDEX idx_orders_created_at (created_at),
  INDEX idx_orders_payment_status (payment_status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 11. ORDER_ITEMS TABLE (Line Items within an Order)
-- ----------------------------------------------------------------------------
CREATE TABLE order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  pizza_id INT UNSIGNED NOT NULL,
  pizza_size_id INT UNSIGNED NOT NULL,
  pizza_name_snapshot VARCHAR(120) NOT NULL,
  size_name_snapshot ENUM('Regular', 'Medium', 'Large') NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_base_price DECIMAL(10, 2) NOT NULL CHECK (unit_base_price >= 0),
  toppings_unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (toppings_unit_price >= 0),
  line_total DECIMAL(10, 2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_items_pizza
    FOREIGN KEY (pizza_id) REFERENCES pizzas(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_order_items_size
    FOREIGN KEY (pizza_size_id) REFERENCES pizza_sizes(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_pizza (pizza_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. ORDER_ITEM_TOPPINGS TABLE (Custom Toppings Selected per Order Line Item)
-- ----------------------------------------------------------------------------
CREATE TABLE order_item_toppings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT UNSIGNED NOT NULL,
  topping_id INT UNSIGNED NOT NULL,
  topping_name_snapshot VARCHAR(80) NOT NULL,
  price_snapshot DECIMAL(10, 2) NOT NULL CHECK (price_snapshot >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_oit_order_item
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_oit_topping
    FOREIGN KEY (topping_id) REFERENCES toppings(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_oit_order_item (order_item_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. PAYMENTS TABLE (Payment Transactions & Gateway Records)
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL UNIQUE,
  transaction_reference VARCHAR(64) NOT NULL UNIQUE,
  payment_method ENUM('COD', 'Online') NOT NULL,
  payment_gateway VARCHAR(50) NOT NULL DEFAULT 'Razorpay_Sandbox',
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_payments_status (payment_status, paid_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 14. INVENTORY_TRANSACTIONS TABLE (Audit Trail of Stock Changes)
-- ----------------------------------------------------------------------------
CREATE TABLE inventory_transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ingredient_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NULL DEFAULT NULL,
  transaction_type ENUM('RESTOCK', 'ORDER_DEDUCTION', 'ADJUSTMENT', 'WASTAGE', 'ORDER_REVERSAL') NOT NULL,
  quantity_change DECIMAL(10, 2) NOT NULL,
  stock_before DECIMAL(10, 2) NOT NULL,
  stock_after DECIMAL(10, 2) NOT NULL,
  notes VARCHAR(255) DEFAULT NULL,
  performed_by INT UNSIGNED NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_tx_ingredient
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_inv_tx_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_inv_tx_user
    FOREIGN KEY (performed_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_inv_tx_ingredient (ingredient_id, created_at),
  INDEX idx_inv_tx_order (order_id)
) ENGINE=InnoDB;
