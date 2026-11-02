# PizzaHub – Pizza Management System (DBMS Mini Project)

**Brand:** PizzaHub — *Fresh Pizza. Happy Moments.*  
**Database:** `pizzahub_db` (MySQL 8.0+ Relational Database)

---

## 1. Project Overview

**PizzaHub – Pizza Management System** is a complete full-stack relational Database Management System (DBMS) mini project built with:
- **Frontend:** React 19, TypeScript, Tailwind CSS, React Router, Lucide Icons, Recharts, Ultra-HD Gourmet Pizza Photography
- **Backend:** Node.js, Express.js, `mysql2/promise` connection pooling, `bcryptjs` password hashing, `jsonwebtoken` (JWT) authentication, input validation
- **Database:** MySQL 8.0+ (`pizzahub_db`) featuring **14 normalized tables**, **5 stored procedures**, **2 views**, **2 triggers**, **ACID transactions**, and **22 analytical SQL queries**.

---

## 2. MySQL 8.0+ Database Connection Architecture & Setup Guide

### Understanding Local Development vs. Google AI Studio Cloud Preview

1. **Running Locally on Your MacBook (`local_development`)**:
   - When you clone/download and run this project on your MacBook, `127.0.0.1:3306` refers to your MacBook's local MySQL 8 daemon.
2. **Running Inside Google AI Studio Cloud Preview (`cloud_preview`)**:
   - Google AI Studio Build runs inside an isolated cloud container. Inside that container, `127.0.0.1` is the cloud container itself — **not** your MacBook's `localhost`.
   - Therefore, the backend automatically detects when it is in the cloud container and **does not** repeatedly spam `127.0.0.1:3306`.
   - To connect a live MySQL 8 database inside the Cloud Preview, configure a remotely accessible MySQL 8 host (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) in the backend environment variables.
   - Database credentials are kept **strictly on the backend** (`server/config/db.ts`) and are never exposed or editable via frontend inputs.

---

### Option A: Local Development Setup on macOS (MySQL 8+)

1. **Install & Start MySQL 8 on macOS** (via Homebrew or the official MySQL macOS DMG):
   ```bash
   brew update
   brew install mysql
   brew services start mysql
   ```
   *(If using XAMPP or MySQL Preference Pane on macOS, ensure the MySQL 8 server is running on port `3306`).*

2. **Initialize the `pizzahub_db` Schema, Seed Data, Views, Procedures & Triggers**:
   Run the SQL scripts in dependency order from the project root:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p pizzahub_db < database/seed.sql
   mysql -u root -p pizzahub_db < database/views.sql
   mysql -u root -p pizzahub_db < database/procedures.sql
   mysql -u root -p pizzahub_db < database/triggers.sql
   ```

3. **Configure `.env` in the Project Root**:
   Copy `.env.example` to `.env` and set your local MySQL 8 credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_local_mysql_password
   DB_NAME=pizzahub_db
   JWT_SECRET=pizzahub_super_secret_jwt_key_2026_dbms_project
   PORT=3000
   ```

4. **Start the Full-Stack Application**:
   ```bash
   npm install
   npm run dev
   ```
   Open `http://localhost:3000`. The top status bar will verify connectivity via `GET /api/health` and display **`MySQL 8: CONNECTED`**.

---

### Option B: Connecting a Remotely Hosted MySQL 8 Database (For Cloud Preview)

Because Google AI Studio Cloud Preview runs in the cloud, connecting a live database from the preview requires a remotely reachable MySQL 8 instance (e.g., **Aiven for MySQL**, **Railway MySQL**, **AWS RDS MySQL 8**, **Google Cloud SQL**, or **DigitalOcean Managed MySQL**):

1. Provision a MySQL 8 database instance and create the `pizzahub_db` database.
2. **Security Best Practice**: Do not expose port `3306` on an unauthenticated public server. Always require strong passwords, TLS/SSL connections, and restrict inbound firewall rules.
3. Set the following backend secrets/environment variables:
   ```env
   DB_HOST=your-remote-mysql8-hostname.aivencloud.com
   DB_PORT=3306
   DB_USER=avnadmin
   DB_PASSWORD=your_remote_mysql_password
   DB_NAME=pizzahub_db
   JWT_SECRET=pizzahub_super_secret_jwt_key_2026_dbms_project
   ```
4. Click **Retry Connection** in the application's top diagnostic banner (which calls `POST /api/health/retry`) and then click **Initialize schema.sql + seed.sql** in the diagnostic modal to bootstrap the remote database.

---

## 3. Entity-Relationship (ER) Diagram & All 14 Relational Tables

```text
+-------------------+       1:N       +-------------------+
|      users        |---------------->|     addresses     |
+-------------------+                 +-------------------+
         |                                      |
         | 1:N                                  | 1:N (nullable)
         v                                      v
+-------------------+       1:1       +-------------------+
|      orders       |---------------->|     payments      |
+-------------------+                 +-------------------+
         |
         | 1:N
         v
+-------------------+       1:N       +-----------------------+
|    order_items    |---------------->|  order_item_toppings  |
+-------------------+                 +-----------------------+
    |            |                                |
    | N:1        | N:1                            | N:1
    v            v                                v
+--------+  +-------------+                 +-----------+
| pizzas |  | pizza_sizes |                 | toppings  |
+--------+  +-------------+                 +-----------+
  |    |                                          ^
  |    +-------------------+                      |
  | N:1                    | 1:N                  | N:1
  v                        v                      |
+------------+      +----------------+------------+
| categories |      | pizza_toppings |
+------------+      +----------------+

+--------+       1:N       +-------------------+       N:1       +------------------------+
| pizzas |---------------->| pizza_ingredients |<----------------|      ingredients       |
+--------+                 +-------------------+                 +------------------------+
                                                                             |
                                                                             | 1:N
                                                                             v
                                                                 +------------------------+
                                                                 | inventory_transactions |
                                                                 +------------------------+
```

### All 14 Relational Tables (`database/schema.sql`)
1. **`users`**: Customer and administrator accounts (`email` UNIQUE, `password_hash`, `role` ENUM).
2. **`categories`**: Pizza categories (`Classic Wood-Fired`, `Gourmet Artisan`, `Spicy & Bold`, `Supreme Meat & Feast`).
3. **`pizzas`**: Core pizza catalog with `category_id` FK (`ON DELETE RESTRICT`), `base_price`, `is_veg`, `spice_level`, `is_available`.
4. **`pizza_sizes`**: `Regular` (8"), `Medium` (10"), and `Large` (12") size pricing per pizza (`UNIQUE(pizza_id, size_name)`).
5. **`toppings`**: Custom extra toppings (`Extra Fior di Latte Mozzarella`, `Crispy Cupped Pepperoni`, etc.).
6. **`pizza_toppings`**: M:N junction table mapping default/recommended toppings to each pizza.
7. **`addresses`**: Customer delivery addresses linked to `users(id)` (`ON DELETE CASCADE`).
8. **`ingredients`**: Kitchen raw material inventory with `current_stock`, `min_reorder_level`, and `cost_per_unit`.
9. **`pizza_ingredients`**: Bill of Materials (BOM) recipe linking each pizza to required ingredient quantities.
10. **`orders`**: Order headers with `order_number` UNIQUE, `order_status`, `payment_method`, `subtotal`, `tax_amount`, `delivery_fee`, `discount_amount`, `final_amount`, and `stock_deducted` flag.
11. **`order_items`**: Line items within an order referencing `orders`, `pizzas`, and `pizza_sizes`.
12. **`order_item_toppings`**: Custom extra toppings added to specific order line items.
13. **`payments`**: Payment gateway transaction records linked 1:1 to `orders(id)`.
14. **`inventory_transactions`**: Audit log recording `RESTOCK`, `ORDER_DEDUCTION`, `ADJUSTMENT`, `WASTAGE`, and `ORDER_REVERSAL` events.

---

## 4. Default Test Credentials (`database/seed.sql`)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@pizzahub.com` | `Admin@123` |
| **Customer** | `aarav@example.com` | `Customer@123` |
| **Customer** | `priya.nair@example.com` | `Customer@123` |

### Promo Coupons for Cart & Checkout
- `WELCOME100`: Flat ₹100 off on orders above ₹400
- `FEAST150`: Flat ₹150 off on orders above ₹900
- `PIZZA20`: 20% off (up to ₹250) on orders above ₹600
