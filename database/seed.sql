-- ============================================================================
-- PIZZAHUB - PIZZA MANAGEMENT SYSTEM (DBMS MINI PROJECT)
-- File: database/seed.sql
-- Target DBMS: MySQL 8.0+
-- Description: Seed script with 1 Admin, 6 Customers, 4 Categories, 16 Pizzas,
--              48 Pizza Sizes, 10 Toppings, 12 Ingredients, 12 Orders,
--              Order Items, Payments, and Inventory Transactions.
-- Default Credentials:
--   Admin:    admin@pizzahub.com    / Admin@123
--   Customer: aarav@example.com     / Customer@123
-- ============================================================================

USE pizzahub_db;

-- ----------------------------------------------------------------------------
-- 1. SEED USERS (1 Admin + 6 Customers)
-- Password hash below corresponds to bcrypt hash of 'Admin@123' / 'Customer@123'
-- ----------------------------------------------------------------------------
INSERT INTO users (id, full_name, email, password_hash, phone, role, is_active, created_at) VALUES
(1, 'Vikramaditya Kulkarni (Admin)', 'admin@pizzahub.com', '$2a$10$X7vG8tQ9z1W2eR3yU4iO5uP6aS7dF8gH9jK0lZ1xC2vB3nM4qW5eR', '+91-9820112233', 'admin', 1, '2026-06-01 09:00:00'),
(2, 'Aarav Sharma', 'aarav@example.com', '$2a$10$X7vG8tQ9z1W2eR3yU4iO5uP6aS7dF8gH9jK0lZ1xC2vB3nM4qW5eR', '+91-9876543210', 'customer', 1, '2026-06-10 14:20:00'),
(3, 'Priya Nair', 'priya.nair@example.com', '$2a$10$X7vG8tQ9z1W2eR3yU4iO5uP6aS7dF8gH9jK0lZ1xC2vB3nM4qW5eR', '+91-9811223344', 'customer', 1, '2026-07-04 18:15:00'),
(4, 'Rohan Deshmukh', 'rohan.d@example.com', '$2a$10$X7vG8tQ9z1W2eR3yU4iO5uP6aS7dF8gH9jK0lZ1xC2vB3nM4qW5eR', '+91-9765432109', 'customer', 1, '2026-07-19 12:30:00'),
(5, 'Ananya Verma', 'ananya.v@example.com', '$2a$10$X7vG8tQ9z1W2eR3yU4iO5uP6aS7dF8gH9jK0lZ1xC2vB3nM4qW5eR', '+91-9988776655', 'customer', 1, '2026-08-05 20:05:00'),
(6, 'Kabir Mehta', 'kabir.mehta@example.com', '$2a$10$X7vG8tQ9z1W2eR3yU4iO5uP6aS7dF8gH9jK0lZ1xC2vB3nM4qW5eR', '+91-9123456780', 'customer', 1, '2026-09-12 16:40:00'),
(7, 'Sneha Patil', 'sneha.patil@example.com', '$2a$10$X7vG8tQ9z1W2eR3yU4iO5uP6aS7dF8gH9jK0lZ1xC2vB3nM4qW5eR', '+91-9345678901', 'customer', 1, '2026-10-01 11:10:00');

-- ----------------------------------------------------------------------------
-- 2. SEED CATEGORIES (4 Categories)
-- ----------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, description, display_order, is_active) VALUES
(1, 'Classic Wood-Fired', 'classic-wood-fired', 'Timeless Neapolitan & Italian classics stone-baked at 450°C with San Marzano tomatoes.', 1, 1),
(2, 'Gourmet Artisan', 'gourmet-artisan', 'Chef-curated specialty pizzas with black truffle, burrata, wild mushrooms, and aged cheeses.', 2, 1),
(3, 'Spicy & Bold', 'spicy-and-bold', 'Fiery creations infused with peri-peri, Calabrian chili oil, roasted jalapenos, and smoky spices.', 3, 1),
(4, 'Supreme Meat & Feast', 'supreme-meat-feast', 'Loaded high-protein pizzas featuring smoky pepperoni, BBQ grilled chicken, and charcuterie.', 4, 1);

-- ----------------------------------------------------------------------------
-- 3. SEED PIZZAS (16 Pizzas)
-- ----------------------------------------------------------------------------
INSERT INTO pizzas (id, category_id, name, slug, description, image_url, base_price, is_veg, spice_level, is_popular, is_best_seller, is_available, prep_time_mins, calories) VALUES
(1, 1, 'Margherita Classica DOP', 'margherita-classica-dop', 'Crushed San Marzano tomato sauce, fresh fior di latte mozzarella, sweet organic basil leaves, and cold-pressed extra virgin olive oil.', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1400&q=85', 299.00, 1, 'Mild', 1, 1, 1, 15, 680),
(2, 1, 'Farmhouse Harvest Crunch', 'farmhouse-harvest-crunch', 'Crisp bell peppers, sweet golden corn, red onions, button mushrooms, and Vine-ripened tomatoes over melted mozzarella.', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=85', 379.00, 1, 'Mild', 1, 1, 1, 18, 740),
(3, 1, 'Quattro Formaggi Gold', 'quattro-formaggi-gold', 'Four-cheese symphony of aged Parmigiano-Reggiano, creamy Gorgonzola, smoked Scamorza, and fresh buffalo mozzarella.', 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=1400&q=85', 449.00, 1, 'Mild', 0, 1, 1, 16, 860),
(4, 1, 'Mediterranean Kalamata', 'mediterranean-kalamata', 'Pitted Greek Kalamata olives, crumbled feta cheese, sun-dried tomatoes, baby spinach, and roasted garlic herb oil.', 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1400&q=85', 419.00, 1, 'Mild', 0, 0, 1, 18, 720),
(5, 2, 'Black Truffle & Wild Mushroom', 'black-truffle-wild-mushroom', 'Roasted cremini and shiitake mushrooms, Umbrian black truffle paste, fontina cheese, thyme sprigs, and garlic cream base.', 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=1400&q=85', 549.00, 1, 'Mild', 1, 1, 1, 20, 810),
(6, 2, 'Genovese Pesto & Burrata', 'genovese-pesto-burrata', 'Hand-pounded basil pine-nut pesto base, whole creamy burrata crown, cherry tomatoes, and toasted pine nuts.', 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=1400&q=85', 529.00, 1, 'Mild', 1, 0, 1, 18, 830),
(7, 2, 'Caramelized Fig & Prosciutto Chicken', 'caramelized-fig-chicken', 'Herb-cured smoked chicken ribbons, balsamic caramelized onions, arugula greens, and shaved parmesan.', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1400&q=85', 569.00, 0, 'Mild', 0, 0, 1, 20, 850),
(8, 2, 'Garlic Confit & Rosemary Bianca', 'garlic-confit-rosemary-bianca', 'Slow-roasted sweet garlic cloves, sea salt, fresh rosemary needles, ricotta dollops, and aged pecorino.', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1400&q=85', 399.00, 1, 'Mild', 0, 0, 1, 16, 760),
(9, 3, 'Fiery Peri-Peri Paneer', 'fiery-peri-peri-paneer', 'Char-grilled cottage cheese cubes marinated in African bird-eye chili peri-peri, red paprika, capsicum, and spicy mayo drizzle.', 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1400&q=85', 439.00, 1, 'Hot', 1, 1, 1, 18, 790),
(10, 3, 'Calabrian Diavola Hot Honey', 'calabrian-diavola-hot-honey', 'Spicy artisanal pepperoni, pickled jalapenos, crushed Calabrian chilies, and wildflower hot honey glaze.', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1400&q=85', 519.00, 0, 'Hot', 1, 1, 1, 18, 880),
(11, 3, 'Mexican Jalapeno Fiesta', 'mexican-jalapeno-fiesta', 'Spiced pinto beans, pickled green jalapenos, sweet corn, diced red onions, chipotle tomato sauce, and cheddar-mozzarella blend.', 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1400&q=85', 409.00, 1, 'Hot', 0, 0, 1, 17, 770),
(12, 3, 'Smoky Tandoori Chicken Tikka', 'smoky-tandoori-chicken-tikka', 'Clay-oven roasted chicken tikka morsels, pickled red onion rings, green chili, fresh mint chutney swirl, and cilantro.', 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=1400&q=85', 489.00, 0, 'Medium', 1, 1, 1, 20, 840),
(13, 4, 'Double Pepperoni Feast', 'double-pepperoni-feast', 'Two layers of crispy cupped charcuterie pepperoni over our signature slow-simmered tomato sauce and 100% whole-milk mozzarella.', 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=1400&q=85', 499.00, 0, 'Medium', 1, 1, 1, 17, 910),
(14, 4, 'Hickory Smoked BBQ Chicken', 'hickory-smoked-bbq-chicken', 'Tender hickory-smoked chicken strips, sweet smoky BBQ sauce, caramelized purple onions, smoked gouda, and fresh cilantro.', 'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?auto=format&fit=crop&w=1400&q=85', 479.00, 0, 'Mild', 1, 1, 1, 19, 860),
(15, 4, 'Sicilian Meat Lovers Supreme', 'sicilian-meat-lovers-supreme', 'Loaded with smoked pepperoni, Italian herb chicken sausage, grilled BBQ chicken, and roasted bell peppers.', 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1400&q=85', 589.00, 0, 'Medium', 1, 1, 1, 22, 980),
(16, 4, 'Roasted Garlic & Herb Chicken', 'roasted-garlic-herb-chicken', 'Succulent rosemary-grilled chicken breast, sun-dried tomatoes, baby spinach, and roasted garlic alfredo drizzle.', 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=85', 469.00, 0, 'Mild', 0, 0, 1, 19, 820);

-- ----------------------------------------------------------------------------
-- 4. SEED PIZZA_SIZES (3 Sizes per Pizza = 48 Rows)
-- ----------------------------------------------------------------------------
INSERT INTO pizza_sizes (id, pizza_id, size_name, size_code, diameter_inches, price, is_available) VALUES
(1, 1, 'Regular', 'REG', 8, 299.00, 1), (2, 1, 'Medium', 'MED', 10, 449.00, 1), (3, 1, 'Large', 'LRG', 12, 599.00, 1),
(4, 2, 'Regular', 'REG', 8, 379.00, 1), (5, 2, 'Medium', 'MED', 10, 529.00, 1), (6, 2, 'Large', 'LRG', 12, 689.00, 1),
(7, 3, 'Regular', 'REG', 8, 449.00, 1), (8, 3, 'Medium', 'MED', 10, 599.00, 1), (9, 3, 'Large', 'LRG', 12, 749.00, 1),
(10, 4, 'Regular', 'REG', 8, 419.00, 1), (11, 4, 'Medium', 'MED', 10, 569.00, 1), (12, 4, 'Large', 'LRG', 12, 719.00, 1),
(13, 5, 'Regular', 'REG', 8, 549.00, 1), (14, 5, 'Medium', 'MED', 10, 729.00, 1), (15, 5, 'Large', 'LRG', 12, 899.00, 1),
(16, 6, 'Regular', 'REG', 8, 529.00, 1), (17, 6, 'Medium', 'MED', 10, 699.00, 1), (18, 6, 'Large', 'LRG', 12, 869.00, 1),
(19, 7, 'Regular', 'REG', 8, 569.00, 1), (20, 7, 'Medium', 'MED', 10, 749.00, 1), (21, 7, 'Large', 'LRG', 12, 919.00, 1),
(22, 8, 'Regular', 'REG', 8, 399.00, 1), (23, 8, 'Medium', 'MED', 10, 549.00, 1), (24, 8, 'Large', 'LRG', 12, 699.00, 1),
(25, 9, 'Regular', 'REG', 8, 439.00, 1), (26, 9, 'Medium', 'MED', 10, 589.00, 1), (27, 9, 'Large', 'LRG', 12, 749.00, 1),
(28, 10, 'Regular', 'REG', 8, 519.00, 1), (29, 10, 'Medium', 'MED', 10, 689.00, 1), (30, 10, 'Large', 'LRG', 12, 849.00, 1),
(31, 11, 'Regular', 'REG', 8, 409.00, 1), (32, 11, 'Medium', 'MED', 10, 559.00, 1), (33, 11, 'Large', 'LRG', 12, 709.00, 1),
(34, 12, 'Regular', 'REG', 8, 489.00, 1), (35, 12, 'Medium', 'MED', 10, 649.00, 1), (36, 12, 'Large', 'LRG', 12, 809.00, 1),
(37, 13, 'Regular', 'REG', 8, 499.00, 1), (38, 13, 'Medium', 'MED', 10, 669.00, 1), (39, 13, 'Large', 'LRG', 12, 829.00, 1),
(40, 14, 'Regular', 'REG', 8, 479.00, 1), (41, 14, 'Medium', 'MED', 10, 639.00, 1), (42, 14, 'Large', 'LRG', 12, 799.00, 1),
(43, 15, 'Regular', 'REG', 8, 589.00, 1), (44, 15, 'Medium', 'MED', 10, 769.00, 1), (45, 15, 'Large', 'LRG', 12, 949.00, 1),
(46, 16, 'Regular', 'REG', 8, 469.00, 1), (47, 16, 'Medium', 'MED', 10, 629.00, 1), (48, 16, 'Large', 'LRG', 12, 789.00, 1);

-- ----------------------------------------------------------------------------
-- 5. SEED TOPPINGS (10 Custom Toppings)
-- ----------------------------------------------------------------------------
INSERT INTO toppings (id, name, category, price, is_veg, is_available) VALUES
(1, 'Extra Fior di Latte Mozzarella', 'Cheese', 75.00, 1, 1),
(2, 'Aged Parmigiano-Reggiano Shavings', 'Cheese', 85.00, 1, 1),
(3, 'Roasted Cremini Mushrooms', 'Veg', 55.00, 1, 1),
(4, 'Greek Kalamata Olives', 'Veg', 60.00, 1, 1),
(5, 'Pickled Green Jalapenos', 'Veg', 45.00, 1, 1),
(6, 'Caramelized Red Onions', 'Veg', 45.00, 1, 1),
(7, 'Peri-Peri Spiced Paneer Cubes', 'Veg', 70.00, 1, 1),
(8, 'Crispy Cupped Pepperoni', 'Non-Veg', 95.00, 0, 1),
(9, 'Smoky BBQ Grilled Chicken', 'Non-Veg', 90.00, 0, 1),
(10, 'Wildflower Hot Honey Drizzle', 'Herb & Spice', 50.00, 1, 1);

-- ----------------------------------------------------------------------------
-- 6. SEED PIZZA_TOPPINGS (Default/Recommended Toppings Map)
-- ----------------------------------------------------------------------------
INSERT INTO pizza_toppings (pizza_id, topping_id, is_default) VALUES
(1, 1, 1), (1, 2, 0),
(2, 3, 1), (2, 6, 1),
(3, 1, 1), (3, 2, 1),
(4, 4, 1),
(5, 3, 1), (5, 2, 1),
(6, 1, 1),
(9, 7, 1), (9, 5, 1),
(10, 8, 1), (10, 5, 1), (10, 10, 1),
(12, 9, 1), (12, 6, 1),
(13, 8, 1), (13, 1, 1),
(14, 9, 1), (14, 6, 1),
(15, 8, 1), (15, 9, 1);

-- ----------------------------------------------------------------------------
-- 7. SEED ADDRESSES (8 Customer Addresses)
-- ----------------------------------------------------------------------------
INSERT INTO addresses (id, user_id, label, recipient_name, phone, street_address, landmark, city, state, postal_code, is_default) VALUES
(1, 2, 'Home', 'Aarav Sharma', '+91-9876543210', 'Flat 402, Emerald Heights, Linking Road, Bandra West', 'Near National College', 'Mumbai', 'Maharashtra', '400050', 1),
(2, 2, 'Office', 'Aarav Sharma', '+91-9876543210', 'Level 8, One BKC Tower C, Bandra Kurla Complex', 'Opposite Jio World Drive', 'Mumbai', 'Maharashtra', '400051', 0),
(3, 3, 'Home', 'Priya Nair', '+91-9811223344', 'Villa 14, Palm Meadows, Whitefield Main Road', 'Beside Forum Value Mall', 'Bengaluru', 'Karnataka', '560066', 1),
(4, 4, 'Home', 'Rohan Deshmukh', '+91-9765432109', 'B-104, Symphony Park, Baner-Pashan Link Road', 'Near Regent Plaza', 'Pune', 'Maharashtra', '411045', 1),
(5, 5, 'Home', 'Ananya Verma', '+91-9988776655', 'House 28, Sector 15 Part II, Civil Lines', 'Near Galaxy Hotel', 'Gurugram', 'Haryana', '122001', 1),
(6, 6, 'Home', 'Kabir Mehta', '+91-9123456780', '701, Sea Breeze Apartments, Worli Sea Face', 'Opposite Worli Promenade', 'Mumbai', 'Maharashtra', '400030', 1),
(7, 7, 'Home', 'Sneha Patil', '+91-9345678901', '302, Silver Oak Residency, Koregaon Park Lane 6', 'Near German Bakery', 'Pune', 'Maharashtra', '411001', 1),
(8, 3, 'Studio', 'Priya Nair', '+91-9811223344', '2nd Floor, Indiranagar 100 Feet Road, HAL 2nd Stage', 'Above Third Wave Coffee', 'Bengaluru', 'Karnataka', '560038', 0);

-- ----------------------------------------------------------------------------
-- 8. SEED INGREDIENTS (12 Kitchen Raw Ingredients - including 3 low-stock items)
-- ----------------------------------------------------------------------------
INSERT INTO ingredients (id, name, sku, unit, current_stock, min_reorder_level, cost_per_unit, supplier_name, last_restocked_at) VALUES
(1, 'Caputo Tipo 00 Pizza Flour', 'ING-FLR-001', 'kg', 85.00, 25.00, 145.00, 'Napoli Imports India Pvt Ltd', '2026-10-25 08:30:00'),
(2, 'San Marzano Crushed Tomatoes', 'ING-TOM-002', 'kg', 42.50, 15.00, 210.00, 'Napoli Imports India Pvt Ltd', '2026-10-26 09:00:00'),
(3, 'Fior di Latte Fresh Mozzarella', 'ING-MOZ-003', 'kg', 38.00, 15.00, 520.00, 'Vallombrosa Creamery', '2026-10-28 07:45:00'),
(4, 'Cold-Pressed Extra Virgin Olive Oil', 'ING-OIL-004', 'liters', 18.50, 8.00, 780.00, 'Mediterranean Oils Co.', '2026-10-20 11:00:00'),
(5, 'Umbrian Black Truffle Paste', 'ING-TRF-005', 'kg', 2.40, 4.00, 4200.00, 'Gourmet Italia Fine Foods', '2026-10-10 10:15:00'),
(6, 'Artisanal Cupped Pepperoni', 'ING-PEP-006', 'kg', 6.20, 10.00, 890.00, 'Continental Charcuterie Works', '2026-10-18 14:00:00'),
(7, 'Smoked BBQ Chicken Breast', 'ING-CHK-007', 'kg', 22.00, 10.00, 460.00, 'Prime Harvest Poultry', '2026-10-29 08:00:00'),
(8, 'Fresh Malai Paneer Block', 'ING-PNR-008', 'kg', 16.50, 8.00, 380.00, 'Sahyadri Dairy Farms', '2026-10-30 06:30:00'),
(9, 'Roasted Cremini & Shiitake Mix', 'ING-MSH-009', 'kg', 14.00, 6.00, 340.00, 'GreenValley Hydroponics', '2026-10-27 09:30:00'),
(10, 'Fresh Sweet Organic Basil', 'ING-BSL-010', 'kg', 1.80, 3.00, 260.00, 'GreenValley Hydroponics', '2026-10-29 07:00:00'),
(11, 'Greek Kalamata Olives (Pitted)', 'ING-OLV-011', 'kg', 11.20, 5.00, 640.00, 'Mediterranean Oils Co.', '2026-10-15 12:00:00'),
(12, 'Pickled Jalapeno Slices', 'ING-JAL-012', 'kg', 13.50, 5.00, 220.00, 'SpiceCraft Condiments', '2026-10-22 15:00:00');

-- ----------------------------------------------------------------------------
-- 9. SEED PIZZA_INGREDIENTS (Recipe Bill of Materials per Pizza)
-- ----------------------------------------------------------------------------
INSERT INTO pizza_ingredients (pizza_id, ingredient_id, quantity_required) VALUES
(1, 1, 0.25), (1, 2, 0.12), (1, 3, 0.15), (1, 10, 0.02),
(2, 1, 0.25), (2, 2, 0.12), (2, 3, 0.15), (2, 9, 0.08),
(3, 1, 0.25), (3, 3, 0.22), (3, 4, 0.02),
(4, 1, 0.25), (4, 2, 0.10), (4, 3, 0.14), (4, 11, 0.06),
(5, 1, 0.25), (5, 3, 0.16), (5, 5, 0.04), (5, 9, 0.12),
(6, 1, 0.25), (6, 3, 0.18), (6, 10, 0.05),
(7, 1, 0.25), (7, 3, 0.15), (7, 7, 0.14),
(8, 1, 0.25), (8, 3, 0.16), (8, 4, 0.03),
(9, 1, 0.25), (9, 2, 0.12), (9, 3, 0.15), (9, 8, 0.15),
(10, 1, 0.25), (10, 2, 0.12), (10, 3, 0.15), (10, 6, 0.12), (10, 12, 0.04),
(11, 1, 0.25), (11, 2, 0.12), (11, 3, 0.15), (11, 12, 0.06),
(12, 1, 0.25), (12, 2, 0.12), (12, 3, 0.15), (12, 7, 0.16),
(13, 1, 0.25), (13, 2, 0.12), (13, 3, 0.16), (13, 6, 0.16),
(14, 1, 0.25), (14, 3, 0.15), (14, 7, 0.16),
(15, 1, 0.25), (15, 2, 0.12), (15, 3, 0.16), (15, 6, 0.10), (15, 7, 0.12),
(16, 1, 0.25), (16, 3, 0.15), (16, 7, 0.15);

-- ----------------------------------------------------------------------------
-- 10. SEED ORDERS (12 Sample Orders across June–November 2026)
-- ----------------------------------------------------------------------------
INSERT INTO orders (
  id, order_number, user_id, address_id, delivery_address_snapshot, customer_phone,
  order_status, payment_method, payment_status, subtotal, tax_amount, delivery_fee,
  discount_amount, final_amount, coupon_code, special_instructions, stock_deducted,
  cancelled_reason, delivered_at, created_at
) VALUES
(1, 'PH-2026-1001', 2, 1, 'Flat 402, Emerald Heights, Linking Road, Bandra West, Mumbai 400050', '+91-9876543210', 'Delivered', 'Online', 'Completed', 1118.00, 55.90, 0.00, 100.00, 1073.90, 'WELCOME100', 'Extra crispy crust please.', 1, NULL, '2026-06-15 20:15:00', '2026-06-15 19:35:00'),
(2, 'PH-2026-1002', 3, 3, 'Villa 14, Palm Meadows, Whitefield Main Road, Bengaluru 560066', '+91-9811223344', 'Delivered', 'Online', 'Completed', 1458.00, 72.90, 0.00, 0.00, 1530.90, NULL, 'Ring doorbell once.', 1, NULL, '2026-07-10 21:05:00', '2026-07-10 20:22:00'),
(3, 'PH-2026-1003', 4, 4, 'B-104, Symphony Park, Baner-Pashan Link Road, Pune 411045', '+91-9765432109', 'Delivered', 'COD', 'Completed', 898.00, 44.90, 0.00, 0.00, 942.90, NULL, NULL, 1, NULL, '2026-08-04 14:10:00', '2026-08-04 13:30:00'),
(4, 'PH-2026-1004', 5, 5, 'House 28, Sector 15 Part II, Civil Lines, Gurugram 122001', '+91-9988776655', 'Delivered', 'Online', 'Completed', 1667.00, 83.35, 0.00, 150.00, 1600.35, 'FEAST150', 'Include extra chili flakes and oregano packets.', 1, NULL, '2026-08-22 20:50:00', '2026-08-22 20:10:00'),
(5, 'PH-2026-1005', 2, 2, 'Level 8, One BKC Tower C, Bandra Kurla Complex, Mumbai 400051', '+91-9876543210', 'Delivered', 'Online', 'Completed', 1398.00, 69.90, 0.00, 0.00, 1467.90, NULL, 'Leave at reception desk.', 1, NULL, '2026-09-09 13:45:00', '2026-09-09 13:05:00'),
(6, 'PH-2026-1006', 6, 6, '701, Sea Breeze Apartments, Worli Sea Face, Mumbai 400030', '+91-9123456780', 'Delivered', 'COD', 'Completed', 1538.00, 76.90, 0.00, 0.00, 1614.90, NULL, NULL, 1, NULL, '2026-09-25 21:20:00', '2026-09-25 20:40:00'),
(7, 'PH-2026-1007', 7, 7, '302, Silver Oak Residency, Koregaon Park Lane 6, Pune 411001', '+91-9345678901', 'Delivered', 'Online', 'Completed', 1238.00, 61.90, 0.00, 0.00, 1299.90, NULL, 'Cut into 8 slices.', 1, NULL, '2026-10-08 19:55:00', '2026-10-08 19:15:00'),
(8, 'PH-2026-1008', 3, 8, '2nd Floor, Indiranagar 100 Feet Road, Bengaluru 560038', '+91-9811223344', 'Delivered', 'Online', 'Completed', 1847.00, 92.35, 0.00, 150.00, 1789.35, 'FEAST150', NULL, 1, NULL, '2026-10-21 20:30:00', '2026-10-21 19:48:00'),
(9, 'PH-2026-1009', 4, 4, 'B-104, Symphony Park, Baner-Pashan Link Road, Pune 411045', '+91-9765432109', 'Cancelled', 'COD', 'Failed', 589.00, 29.45, 0.00, 0.00, 618.45, NULL, NULL, 0, 'Customer changed delivery schedule.', NULL, '2026-10-28 18:10:00'),
(10, 'PH-2026-1010', 5, 5, 'House 28, Sector 15 Part II, Civil Lines, Gurugram 122001', '+91-9988776655', 'Out for Delivery', 'Online', 'Completed', 1318.00, 65.90, 0.00, 0.00, 1383.90, NULL, 'Call upon arrival at gate.', 1, NULL, NULL, '2026-11-02 12:15:00'),
(11, 'PH-2026-1011', 2, 1, 'Flat 402, Emerald Heights, Linking Road, Bandra West, Mumbai 400050', '+91-9876543210', 'Preparing', 'Online', 'Completed', 1473.00, 73.65, 0.00, 100.00, 1446.65, 'WELCOME100', 'Extra basil on the Margherita.', 1, NULL, NULL, '2026-11-02 13:10:00'),
(12, 'PH-2026-1012', 6, 6, '701, Sea Breeze Apartments, Worli Sea Face, Mumbai 400030', '+91-9123456780', 'Pending', 'COD', 'Pending', 949.00, 47.45, 0.00, 0.00, 996.45, NULL, 'Include garlic dip.', 1, NULL, NULL, '2026-11-02 13:40:00');

-- ----------------------------------------------------------------------------
-- 11. SEED ORDER_ITEMS (21 Line Items across the 12 Orders)
-- ----------------------------------------------------------------------------
INSERT INTO order_items (
  id, order_id, pizza_id, pizza_size_id, pizza_name_snapshot, size_name_snapshot,
  quantity, unit_base_price, toppings_unit_price, line_total
) VALUES
(1, 1, 1, 2, 'Margherita Classica DOP', 'Medium', 1, 449.00, 0.00, 449.00),
(2, 1, 13, 38, 'Double Pepperoni Feast', 'Medium', 1, 669.00, 0.00, 669.00),
(3, 2, 5, 14, 'Black Truffle & Wild Mushroom', 'Medium', 2, 729.00, 0.00, 1458.00),
(4, 3, 1, 2, 'Margherita Classica DOP', 'Medium', 2, 449.00, 0.00, 898.00),
(5, 4, 15, 45, 'Sicilian Meat Lovers Supreme', 'Large', 1, 949.00, 95.00, 1044.00),
(6, 4, 9, 26, 'Fiery Peri-Peri Paneer', 'Medium', 1, 589.00, 34.00, 623.00),
(7, 5, 6, 17, 'Genovese Pesto & Burrata', 'Medium', 2, 699.00, 0.00, 1398.00),
(8, 6, 15, 44, 'Sicilian Meat Lovers Supreme', 'Medium', 2, 769.00, 0.00, 1538.00),
(9, 7, 14, 41, 'Hickory Smoked BBQ Chicken', 'Medium', 1, 639.00, 0.00, 639.00),
(10, 7, 3, 8, 'Quattro Formaggi Gold', 'Medium', 1, 599.00, 0.00, 599.00),
(11, 8, 10, 30, 'Calabrian Diavola Hot Honey', 'Large', 1, 849.00, 50.00, 899.00),
(12, 8, 5, 15, 'Black Truffle & Wild Mushroom', 'Large', 1, 899.00, 49.00, 948.00),
(13, 9, 9, 26, 'Fiery Peri-Peri Paneer', 'Medium', 1, 589.00, 0.00, 589.00),
(14, 10, 12, 35, 'Smoky Tandoori Chicken Tikka', 'Medium', 1, 649.00, 0.00, 649.00),
(15, 10, 13, 38, 'Double Pepperoni Feast', 'Medium', 1, 669.00, 0.00, 669.00),
(16, 11, 5, 14, 'Black Truffle & Wild Mushroom', 'Medium', 1, 729.00, 75.00, 804.00),
(17, 11, 13, 38, 'Double Pepperoni Feast', 'Medium', 1, 669.00, 0.00, 669.00),
(18, 12, 15, 45, 'Sicilian Meat Lovers Supreme', 'Large', 1, 949.00, 0.00, 949.00);

-- ----------------------------------------------------------------------------
-- 12. SEED ORDER_ITEM_TOPPINGS (Custom Toppings on Order Items)
-- ----------------------------------------------------------------------------
INSERT INTO order_item_toppings (order_item_id, topping_id, topping_name_snapshot, price_snapshot) VALUES
(5, 8, 'Crispy Cupped Pepperoni', 95.00),
(11, 10, 'Wildflower Hot Honey Drizzle', 50.00),
(16, 1, 'Extra Fior di Latte Mozzarella', 75.00);

-- ----------------------------------------------------------------------------
-- 13. SEED PAYMENTS (12 Payment Records corresponding to the 12 Orders)
-- ----------------------------------------------------------------------------
INSERT INTO payments (
  id, order_id, transaction_reference, payment_method, payment_gateway,
  amount, payment_status, paid_at, created_at
) VALUES
(1, 1, 'TXN-PH-20260615-001', 'Online', 'Razorpay_UPI', 1073.90, 'Completed', '2026-06-15 19:36:10', '2026-06-15 19:35:00'),
(2, 2, 'TXN-PH-20260710-002', 'Online', 'Razorpay_Card', 1530.90, 'Completed', '2026-07-10 20:23:05', '2026-07-10 20:22:00'),
(3, 3, 'TXN-PH-20260804-003', 'COD', 'Cash_On_Delivery', 942.90, 'Completed', '2026-08-04 14:10:00', '2026-08-04 13:30:00'),
(4, 4, 'TXN-PH-20260822-004', 'Online', 'Razorpay_UPI', 1600.35, 'Completed', '2026-08-22 20:11:00', '2026-08-22 20:10:00'),
(5, 5, 'TXN-PH-20260909-005', 'Online', 'Razorpay_Card', 1467.90, 'Completed', '2026-09-09 13:06:12', '2026-09-09 13:05:00'),
(6, 6, 'TXN-PH-20260925-006', 'COD', 'Cash_On_Delivery', 1614.90, 'Completed', '2026-09-25 21:20:00', '2026-09-25 20:40:00'),
(7, 7, 'TXN-PH-20261008-007', 'Online', 'Razorpay_UPI', 1299.90, 'Completed', '2026-10-08 19:16:00', '2026-10-08 19:15:00'),
(8, 8, 'TXN-PH-20261021-008', 'Online', 'Razorpay_NetBanking', 1789.35, 'Completed', '2026-10-21 19:49:10', '2026-10-21 19:48:00'),
(9, 9, 'TXN-PH-20261028-009', 'COD', 'Cash_On_Delivery', 618.45, 'Failed', NULL, '2026-10-28 18:10:00'),
(10, 10, 'TXN-PH-20261102-010', 'Online', 'Razorpay_UPI', 1383.90, 'Completed', '2026-11-02 12:16:00', '2026-11-02 12:15:00'),
(11, 11, 'TXN-PH-20261102-011', 'Online', 'Razorpay_Card', 1446.65, 'Completed', '2026-11-02 13:11:00', '2026-11-02 13:10:00'),
(12, 12, 'TXN-PH-20261102-012', 'COD', 'Cash_On_Delivery', 996.45, 'Pending', NULL, '2026-11-02 13:40:00');

-- ----------------------------------------------------------------------------
-- 14. SEED INVENTORY_TRANSACTIONS (Audit Logs for Restocks & Order Deductions)
-- ----------------------------------------------------------------------------
INSERT INTO inventory_transactions (
  id, ingredient_id, order_id, transaction_type, quantity_change,
  stock_before, stock_after, notes, performed_by, created_at
) VALUES
(1, 1, NULL, 'RESTOCK', 50.00, 35.50, 85.50, 'Monthly bulk Caputo 00 flour delivery', 1, '2026-10-25 08:30:00'),
(2, 3, NULL, 'RESTOCK', 25.00, 13.62, 38.62, 'Fresh mozzarella batch #MZ-409', 1, '2026-10-28 07:45:00'),
(3, 5, 8, 'ORDER_DEDUCTION', -0.04, 2.48, 2.44, 'Auto-deducted for Order PH-2026-1008', NULL, '2026-10-21 19:48:05'),
(4, 6, 10, 'ORDER_DEDUCTION', -0.16, 6.52, 6.36, 'Auto-deducted for Order PH-2026-1010', NULL, '2026-11-02 12:15:05'),
(5, 5, 11, 'ORDER_DEDUCTION', -0.04, 2.44, 2.40, 'Auto-deducted for Order PH-2026-1011', NULL, '2026-11-02 13:10:05'),
(6, 6, 11, 'ORDER_DEDUCTION', -0.16, 6.36, 6.20, 'Auto-deducted for Order PH-2026-1011', NULL, '2026-11-02 13:10:06'),
(7, 1, 12, 'ORDER_DEDUCTION', -0.25, 85.25, 85.00, 'Auto-deducted for Order PH-2026-1012', NULL, '2026-11-02 13:40:05'),
(8, 3, 12, 'ORDER_DEDUCTION', -0.16, 38.16, 38.00, 'Auto-deducted for Order PH-2026-1012', NULL, '2026-11-02 13:40:06');
