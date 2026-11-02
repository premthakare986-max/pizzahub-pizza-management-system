import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { getPool, getLastConnectionState } from '../config/db.ts';

export interface UserRow {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: 'customer' | 'admin';
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface PizzaRow {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  base_price: number;
  is_veg: number;
  spice_level: 'Mild' | 'Medium' | 'Hot';
  is_popular: number;
  is_best_seller: number;
  is_available: number;
  prep_time_mins: number;
  calories: number;
  created_at: string;
  updated_at: string;
}

export interface PizzaSizeRow {
  id: number;
  pizza_id: number;
  size_name: 'Regular' | 'Medium' | 'Large';
  size_code: string;
  diameter_inches: number;
  price: number;
  is_available: number;
}

export interface ToppingRow {
  id: number;
  name: string;
  category: 'Veg' | 'Non-Veg' | 'Cheese' | 'Herb & Spice';
  price: number;
  is_veg: number;
  is_available: number;
}

export interface PizzaToppingRow {
  id: number;
  pizza_id: number;
  topping_id: number;
  is_default: number;
}

export interface AddressRow {
  id: number;
  user_id: number;
  label: string;
  recipient_name: string;
  phone: string;
  street_address: string;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface IngredientRow {
  id: number;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
  min_reorder_level: number;
  cost_per_unit: number;
  supplier_name: string;
  last_restocked_at: string;
  created_at: string;
  updated_at: string;
}

export interface PizzaIngredientRow {
  id: number;
  pizza_id: number;
  ingredient_id: number;
  quantity_required: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderRow {
  id: number;
  order_number: string;
  user_id: number;
  address_id: number | null;
  delivery_address_snapshot: string;
  customer_phone: string;
  order_status: OrderStatus;
  payment_method: 'COD' | 'Online';
  payment_status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  discount_amount: number;
  final_amount: number;
  coupon_code: string | null;
  special_instructions: string | null;
  stock_deducted: number;
  cancelled_reason: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  pizza_id: number;
  pizza_size_id: number;
  pizza_name_snapshot: string;
  size_name_snapshot: 'Regular' | 'Medium' | 'Large';
  quantity: number;
  unit_base_price: number;
  toppings_unit_price: number;
  line_total: number;
  created_at: string;
}

export interface OrderItemToppingRow {
  id: number;
  order_item_id: number;
  topping_id: number;
  topping_name_snapshot: string;
  price_snapshot: number;
}

export interface PaymentRow {
  id: number;
  order_id: number;
  transaction_reference: string;
  payment_method: 'COD' | 'Online';
  payment_gateway: string;
  amount: number;
  payment_status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransactionRow {
  id: number;
  ingredient_id: number;
  order_id: number | null;
  transaction_type: 'RESTOCK' | 'ORDER_DEDUCTION' | 'ADJUSTMENT' | 'WASTAGE' | 'ORDER_REVERSAL';
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  notes: string | null;
  performed_by: number | null;
  created_at: string;
}

export interface RelationalDatabaseState {
  users: UserRow[];
  categories: CategoryRow[];
  pizzas: PizzaRow[];
  pizza_sizes: PizzaSizeRow[];
  toppings: ToppingRow[];
  pizza_toppings: PizzaToppingRow[];
  addresses: AddressRow[];
  ingredients: IngredientRow[];
  pizza_ingredients: PizzaIngredientRow[];
  orders: OrderRow[];
  order_items: OrderItemRow[];
  order_item_toppings: OrderItemToppingRow[];
  payments: PaymentRow[];
  inventory_transactions: InventoryTransactionRow[];
}

const adminHash = bcrypt.hashSync('Admin@123', 10);
const customerHash = bcrypt.hashSync('Customer@123', 10);

export const dbState: RelationalDatabaseState = {
  users: [
    { id: 1, full_name: 'Vikramaditya Kulkarni (Admin)', email: 'admin@pizzahub.com', password_hash: adminHash, phone: '+91-9820112233', role: 'admin', is_active: 1, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 2, full_name: 'Aarav Sharma', email: 'aarav@example.com', password_hash: customerHash, phone: '+91-9876543210', role: 'customer', is_active: 1, created_at: '2026-06-10T14:20:00.000Z', updated_at: '2026-06-10T14:20:00.000Z' },
    { id: 3, full_name: 'Priya Nair', email: 'priya.nair@example.com', password_hash: customerHash, phone: '+91-9811223344', role: 'customer', is_active: 1, created_at: '2026-07-04T18:15:00.000Z', updated_at: '2026-07-04T18:15:00.000Z' },
    { id: 4, full_name: 'Rohan Deshmukh', email: 'rohan.d@example.com', password_hash: customerHash, phone: '+91-9765432109', role: 'customer', is_active: 1, created_at: '2026-07-19T12:30:00.000Z', updated_at: '2026-07-19T12:30:00.000Z' },
    { id: 5, full_name: 'Ananya Verma', email: 'ananya.v@example.com', password_hash: customerHash, phone: '+91-9988776655', role: 'customer', is_active: 1, created_at: '2026-08-05T20:05:00.000Z', updated_at: '2026-08-05T20:05:00.000Z' },
    { id: 6, full_name: 'Kabir Mehta', email: 'kabir.mehta@example.com', password_hash: customerHash, phone: '+91-9123456780', role: 'customer', is_active: 1, created_at: '2026-09-12T16:40:00.000Z', updated_at: '2026-09-12T16:40:00.000Z' },
    { id: 7, full_name: 'Sneha Patil', email: 'sneha.patil@example.com', password_hash: customerHash, phone: '+91-9345678901', role: 'customer', is_active: 1, created_at: '2026-10-01T11:10:00.000Z', updated_at: '2026-10-01T11:10:00.000Z' },
  ],
  categories: [
    { id: 1, name: 'Classic Wood-Fired', slug: 'classic-wood-fired', description: 'Timeless Neapolitan & Italian classics stone-baked at 450°C with San Marzano tomatoes.', display_order: 1, is_active: 1, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 2, name: 'Gourmet Artisan', slug: 'gourmet-artisan', description: 'Chef-curated specialty pizzas with black truffle, burrata, wild mushrooms, and aged cheeses.', display_order: 2, is_active: 1, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 3, name: 'Spicy & Bold', slug: 'spicy-and-bold', description: 'Fiery creations infused with peri-peri, Calabrian chili oil, roasted jalapenos, and smoky spices.', display_order: 3, is_active: 1, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 4, name: 'Supreme Meat & Feast', slug: 'supreme-meat-feast', description: 'Loaded high-protein pizzas featuring smoky pepperoni, BBQ grilled chicken, and charcuterie.', display_order: 4, is_active: 1, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
  ],
  pizzas: [
    { id: 1, category_id: 1, name: 'Margherita Classica DOP', slug: 'margherita-classica-dop', description: 'Crushed San Marzano tomato sauce, fresh fior di latte mozzarella, sweet organic basil leaves, and cold-pressed extra virgin olive oil.', image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1400&q=85', base_price: 299, is_veg: 1, spice_level: 'Mild', is_popular: 1, is_best_seller: 1, is_available: 1, prep_time_mins: 15, calories: 680, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 2, category_id: 1, name: 'Farmhouse Harvest Crunch', slug: 'farmhouse-harvest-crunch', description: 'Crisp bell peppers, sweet golden corn, red onions, button mushrooms, and vine-ripened tomatoes over melted mozzarella.', image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=85', base_price: 379, is_veg: 1, spice_level: 'Mild', is_popular: 1, is_best_seller: 1, is_available: 1, prep_time_mins: 18, calories: 740, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 3, category_id: 1, name: 'Quattro Formaggi Gold', slug: 'quattro-formaggi-gold', description: 'Four-cheese symphony of aged Parmigiano-Reggiano, creamy Gorgonzola, smoked Scamorza, and fresh buffalo mozzarella.', image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=1400&q=85', base_price: 449, is_veg: 1, spice_level: 'Mild', is_popular: 0, is_best_seller: 1, is_available: 1, prep_time_mins: 16, calories: 860, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 4, category_id: 1, name: 'Mediterranean Kalamata', slug: 'mediterranean-kalamata', description: 'Pitted Greek Kalamata olives, crumbled feta cheese, sun-dried tomatoes, baby spinach, and roasted garlic herb oil.', image_url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1400&q=85', base_price: 419, is_veg: 1, spice_level: 'Mild', is_popular: 0, is_best_seller: 0, is_available: 1, prep_time_mins: 18, calories: 720, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 5, category_id: 2, name: 'Black Truffle & Wild Mushroom', slug: 'black-truffle-wild-mushroom', description: 'Roasted cremini and shiitake mushrooms, Umbrian black truffle paste, fontina cheese, thyme sprigs, and garlic cream base.', image_url: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=1400&q=85', base_price: 549, is_veg: 1, spice_level: 'Mild', is_popular: 1, is_best_seller: 1, is_available: 1, prep_time_mins: 20, calories: 810, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 6, category_id: 2, name: 'Genovese Pesto & Burrata', slug: 'genovese-pesto-burrata', description: 'Hand-pounded basil pine-nut pesto base, whole creamy burrata crown, cherry tomatoes, and toasted pine nuts.', image_url: 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=1400&q=85', base_price: 529, is_veg: 1, spice_level: 'Mild', is_popular: 1, is_best_seller: 0, is_available: 1, prep_time_mins: 18, calories: 830, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 7, category_id: 2, name: 'Caramelized Fig & Prosciutto Chicken', slug: 'caramelized-fig-chicken', description: 'Herb-cured smoked chicken ribbons, balsamic caramelized onions, arugula greens, and shaved parmesan.', image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1400&q=85', base_price: 569, is_veg: 0, spice_level: 'Mild', is_popular: 0, is_best_seller: 0, is_available: 1, prep_time_mins: 20, calories: 850, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 8, category_id: 2, name: 'Garlic Confit & Rosemary Bianca', slug: 'garlic-confit-rosemary-bianca', description: 'Slow-roasted sweet garlic cloves, sea salt, fresh rosemary needles, ricotta dollops, and aged pecorino.', image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1400&q=85', base_price: 399, is_veg: 1, spice_level: 'Mild', is_popular: 0, is_best_seller: 0, is_available: 1, prep_time_mins: 16, calories: 760, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 9, category_id: 3, name: 'Fiery Peri-Peri Paneer', slug: 'fiery-peri-peri-paneer', description: 'Char-grilled cottage cheese cubes marinated in African bird-eye chili peri-peri, red paprika, capsicum, and spicy mayo drizzle.', image_url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1400&q=85', base_price: 439, is_veg: 1, spice_level: 'Hot', is_popular: 1, is_best_seller: 1, is_available: 1, prep_time_mins: 18, calories: 790, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 10, category_id: 3, name: 'Calabrian Diavola Hot Honey', slug: 'calabrian-diavola-hot-honey', description: 'Spicy artisanal pepperoni, pickled jalapenos, crushed Calabrian chilies, and wildflower hot honey glaze.', image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1400&q=85', base_price: 519, is_veg: 0, spice_level: 'Hot', is_popular: 1, is_best_seller: 1, is_available: 1, prep_time_mins: 18, calories: 880, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 11, category_id: 3, name: 'Mexican Jalapeno Fiesta', slug: 'mexican-jalapeno-fiesta', description: 'Spiced pinto beans, pickled green jalapenos, sweet corn, diced red onions, chipotle tomato sauce, and cheddar-mozzarella blend.', image_url: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1400&q=85', base_price: 409, is_veg: 1, spice_level: 'Hot', is_popular: 0, is_best_seller: 0, is_available: 1, prep_time_mins: 17, calories: 770, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 12, category_id: 3, name: 'Smoky Tandoori Chicken Tikka', slug: 'smoky-tandoori-chicken-tikka', description: 'Clay-oven roasted chicken tikka morsels, pickled red onion rings, green chili, fresh mint chutney swirl, and cilantro.', image_url: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=1400&q=85', base_price: 489, is_veg: 0, spice_level: 'Medium', is_popular: 1, is_best_seller: 1, is_available: 1, prep_time_mins: 20, calories: 840, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 13, category_id: 4, name: 'Double Pepperoni Feast', slug: 'double-pepperoni-feast', description: 'Two layers of crispy cupped charcuterie pepperoni over our signature slow-simmered tomato sauce and 100% whole-milk mozzarella.', image_url: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=1400&q=85', base_price: 499, is_veg: 0, spice_level: 'Medium', is_popular: 1, is_best_seller: 1, is_available: 1, prep_time_mins: 17, calories: 910, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 14, category_id: 4, name: 'Hickory Smoked BBQ Chicken', slug: 'hickory-smoked-bbq-chicken', description: 'Tender hickory-smoked chicken strips, sweet smoky BBQ sauce, caramelized purple onions, smoked gouda, and fresh cilantro.', image_url: 'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?auto=format&fit=crop&w=1400&q=85', base_price: 479, is_veg: 0, spice_level: 'Mild', is_popular: 1, is_best_seller: 1, is_available: 1, prep_time_mins: 19, calories: 860, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 15, category_id: 4, name: 'Sicilian Meat Lovers Supreme', slug: 'sicilian-meat-lovers-supreme', description: 'Loaded with smoked pepperoni, Italian herb chicken sausage, grilled BBQ chicken, and roasted bell peppers.', image_url: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1400&q=85', base_price: 589, is_veg: 0, spice_level: 'Medium', is_popular: 1, is_best_seller: 1, is_available: 1, prep_time_mins: 22, calories: 980, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
    { id: 16, category_id: 4, name: 'Roasted Garlic & Herb Chicken', slug: 'roasted-garlic-herb-chicken', description: 'Succulent rosemary-grilled chicken breast, sun-dried tomatoes, baby spinach, and roasted garlic alfredo drizzle.', image_url: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=85', base_price: 469, is_veg: 0, spice_level: 'Mild', is_popular: 0, is_best_seller: 0, is_available: 1, prep_time_mins: 19, calories: 820, created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-06-01T09:00:00.000Z' },
  ],
  pizza_sizes: [
    { id: 1, pizza_id: 1, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 299, is_available: 1 },
    { id: 2, pizza_id: 1, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 449, is_available: 1 },
    { id: 3, pizza_id: 1, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 599, is_available: 1 },
    { id: 4, pizza_id: 2, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 379, is_available: 1 },
    { id: 5, pizza_id: 2, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 529, is_available: 1 },
    { id: 6, pizza_id: 2, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 689, is_available: 1 },
    { id: 7, pizza_id: 3, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 449, is_available: 1 },
    { id: 8, pizza_id: 3, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 599, is_available: 1 },
    { id: 9, pizza_id: 3, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 749, is_available: 1 },
    { id: 10, pizza_id: 4, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 419, is_available: 1 },
    { id: 11, pizza_id: 4, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 569, is_available: 1 },
    { id: 12, pizza_id: 4, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 719, is_available: 1 },
    { id: 13, pizza_id: 5, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 549, is_available: 1 },
    { id: 14, pizza_id: 5, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 729, is_available: 1 },
    { id: 15, pizza_id: 5, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 899, is_available: 1 },
    { id: 16, pizza_id: 6, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 529, is_available: 1 },
    { id: 17, pizza_id: 6, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 699, is_available: 1 },
    { id: 18, pizza_id: 6, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 869, is_available: 1 },
    { id: 19, pizza_id: 7, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 569, is_available: 1 },
    { id: 20, pizza_id: 7, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 749, is_available: 1 },
    { id: 21, pizza_id: 7, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 919, is_available: 1 },
    { id: 22, pizza_id: 8, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 399, is_available: 1 },
    { id: 23, pizza_id: 8, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 549, is_available: 1 },
    { id: 24, pizza_id: 8, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 699, is_available: 1 },
    { id: 25, pizza_id: 9, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 439, is_available: 1 },
    { id: 26, pizza_id: 9, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 589, is_available: 1 },
    { id: 27, pizza_id: 9, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 749, is_available: 1 },
    { id: 28, pizza_id: 10, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 519, is_available: 1 },
    { id: 29, pizza_id: 10, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 689, is_available: 1 },
    { id: 30, pizza_id: 10, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 849, is_available: 1 },
    { id: 31, pizza_id: 11, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 409, is_available: 1 },
    { id: 32, pizza_id: 11, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 559, is_available: 1 },
    { id: 33, pizza_id: 11, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 709, is_available: 1 },
    { id: 34, pizza_id: 12, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 489, is_available: 1 },
    { id: 35, pizza_id: 12, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 649, is_available: 1 },
    { id: 36, pizza_id: 12, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 809, is_available: 1 },
    { id: 37, pizza_id: 13, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 499, is_available: 1 },
    { id: 38, pizza_id: 13, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 669, is_available: 1 },
    { id: 39, pizza_id: 13, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 829, is_available: 1 },
    { id: 40, pizza_id: 14, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 479, is_available: 1 },
    { id: 41, pizza_id: 14, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 639, is_available: 1 },
    { id: 42, pizza_id: 14, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 799, is_available: 1 },
    { id: 43, pizza_id: 15, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 589, is_available: 1 },
    { id: 44, pizza_id: 15, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 769, is_available: 1 },
    { id: 45, pizza_id: 15, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 949, is_available: 1 },
    { id: 46, pizza_id: 16, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: 469, is_available: 1 },
    { id: 47, pizza_id: 16, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: 629, is_available: 1 },
    { id: 48, pizza_id: 16, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: 789, is_available: 1 },
  ],
  toppings: [
    { id: 1, name: 'Extra Fior di Latte Mozzarella', category: 'Cheese', price: 75, is_veg: 1, is_available: 1 },
    { id: 2, name: 'Aged Parmigiano-Reggiano Shavings', category: 'Cheese', price: 85, is_veg: 1, is_available: 1 },
    { id: 3, name: 'Roasted Cremini Mushrooms', category: 'Veg', price: 55, is_veg: 1, is_available: 1 },
    { id: 4, name: 'Greek Kalamata Olives', category: 'Veg', price: 60, is_veg: 1, is_available: 1 },
    { id: 5, name: 'Pickled Green Jalapenos', category: 'Veg', price: 45, is_veg: 1, is_available: 1 },
    { id: 6, name: 'Caramelized Red Onions', category: 'Veg', price: 45, is_veg: 1, is_available: 1 },
    { id: 7, name: 'Peri-Peri Spiced Paneer Cubes', category: 'Veg', price: 70, is_veg: 1, is_available: 1 },
    { id: 8, name: 'Crispy Cupped Pepperoni', category: 'Non-Veg', price: 95, is_veg: 0, is_available: 1 },
    { id: 9, name: 'Smoky BBQ Grilled Chicken', category: 'Non-Veg', price: 90, is_veg: 0, is_available: 1 },
    { id: 10, name: 'Wildflower Hot Honey Drizzle', category: 'Herb & Spice', price: 50, is_veg: 1, is_available: 1 },
  ],
  pizza_toppings: [
    { id: 1, pizza_id: 1, topping_id: 1, is_default: 1 },
    { id: 2, pizza_id: 2, topping_id: 3, is_default: 1 },
    { id: 3, pizza_id: 3, topping_id: 1, is_default: 1 },
    { id: 4, pizza_id: 3, topping_id: 2, is_default: 1 },
    { id: 5, pizza_id: 4, topping_id: 4, is_default: 1 },
    { id: 6, pizza_id: 5, topping_id: 3, is_default: 1 },
    { id: 7, pizza_id: 9, topping_id: 7, is_default: 1 },
    { id: 8, pizza_id: 10, topping_id: 8, is_default: 1 },
    { id: 9, pizza_id: 10, topping_id: 10, is_default: 1 },
    { id: 10, pizza_id: 13, topping_id: 8, is_default: 1 },
    { id: 11, pizza_id: 14, topping_id: 9, is_default: 1 },
    { id: 12, pizza_id: 15, topping_id: 8, is_default: 1 },
    { id: 13, pizza_id: 15, topping_id: 9, is_default: 1 },
  ],
  addresses: [
    { id: 1, user_id: 2, label: 'Home', recipient_name: 'Aarav Sharma', phone: '+91-9876543210', street_address: 'Flat 402, Emerald Heights, Linking Road, Bandra West', landmark: 'Near National College', city: 'Mumbai', state: 'Maharashtra', postal_code: '400050', is_default: 1, created_at: '2026-06-10T14:25:00.000Z', updated_at: '2026-06-10T14:25:00.000Z' },
    { id: 2, user_id: 2, label: 'Office', recipient_name: 'Aarav Sharma', phone: '+91-9876543210', street_address: 'Level 8, One BKC Tower C, Bandra Kurla Complex', landmark: 'Opposite Jio World Drive', city: 'Mumbai', state: 'Maharashtra', postal_code: '400051', is_default: 0, created_at: '2026-06-12T10:00:00.000Z', updated_at: '2026-06-12T10:00:00.000Z' },
    { id: 3, user_id: 3, label: 'Home', recipient_name: 'Priya Nair', phone: '+91-9811223344', street_address: 'Villa 14, Palm Meadows, Whitefield Main Road', landmark: 'Beside Forum Value Mall', city: 'Bengaluru', state: 'Karnataka', postal_code: '560066', is_default: 1, created_at: '2026-07-04T18:20:00.000Z', updated_at: '2026-07-04T18:20:00.000Z' },
    { id: 4, user_id: 4, label: 'Home', recipient_name: 'Rohan Deshmukh', phone: '+91-9765432109', street_address: 'B-104, Symphony Park, Baner-Pashan Link Road', landmark: 'Near Regent Plaza', city: 'Pune', state: 'Maharashtra', postal_code: '411045', is_default: 1, created_at: '2026-07-19T12:35:00.000Z', updated_at: '2026-07-19T12:35:00.000Z' },
    { id: 5, user_id: 5, label: 'Home', recipient_name: 'Ananya Verma', phone: '+91-9988776655', street_address: 'House 28, Sector 15 Part II, Civil Lines', landmark: 'Near Galaxy Hotel', city: 'Gurugram', state: 'Haryana', postal_code: '122001', is_default: 1, created_at: '2026-08-05T20:10:00.000Z', updated_at: '2026-08-05T20:10:00.000Z' },
    { id: 6, user_id: 6, label: 'Home', recipient_name: 'Kabir Mehta', phone: '+91-9123456780', street_address: '701, Sea Breeze Apartments, Worli Sea Face', landmark: 'Opposite Worli Promenade', city: 'Mumbai', state: 'Maharashtra', postal_code: '400030', is_default: 1, created_at: '2026-09-12T16:45:00.000Z', updated_at: '2026-09-12T16:45:00.000Z' },
    { id: 7, user_id: 7, label: 'Home', recipient_name: 'Sneha Patil', phone: '+91-9345678901', street_address: '302, Silver Oak Residency, Koregaon Park Lane 6', landmark: 'Near German Bakery', city: 'Pune', state: 'Maharashtra', postal_code: '411001', is_default: 1, created_at: '2026-10-01T11:15:00.000Z', updated_at: '2026-10-01T11:15:00.000Z' },
    { id: 8, user_id: 3, label: 'Studio', recipient_name: 'Priya Nair', phone: '+91-9811223344', street_address: '2nd Floor, Indiranagar 100 Feet Road, HAL 2nd Stage', landmark: 'Above Third Wave Coffee', city: 'Bengaluru', state: 'Karnataka', postal_code: '560038', is_default: 0, created_at: '2026-10-15T09:00:00.000Z', updated_at: '2026-10-15T09:00:00.000Z' },
  ],
  ingredients: [
    { id: 1, name: 'Caputo Tipo 00 Pizza Flour', sku: 'ING-FLR-001', unit: 'kg', current_stock: 85.0, min_reorder_level: 25.0, cost_per_unit: 145, supplier_name: 'Napoli Imports India Pvt Ltd', last_restocked_at: '2026-10-25T08:30:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-25T08:30:00.000Z' },
    { id: 2, name: 'San Marzano Crushed Tomatoes', sku: 'ING-TOM-002', unit: 'kg', current_stock: 42.5, min_reorder_level: 15.0, cost_per_unit: 210, supplier_name: 'Napoli Imports India Pvt Ltd', last_restocked_at: '2026-10-26T09:00:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-26T09:00:00.000Z' },
    { id: 3, name: 'Fior di Latte Fresh Mozzarella', sku: 'ING-MOZ-003', unit: 'kg', current_stock: 38.0, min_reorder_level: 15.0, cost_per_unit: 520, supplier_name: 'Vallombrosa Creamery', last_restocked_at: '2026-10-28T07:45:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-28T07:45:00.000Z' },
    { id: 4, name: 'Cold-Pressed Extra Virgin Olive Oil', sku: 'ING-OIL-004', unit: 'liters', current_stock: 18.5, min_reorder_level: 8.0, cost_per_unit: 780, supplier_name: 'Mediterranean Oils Co.', last_restocked_at: '2026-10-20T11:00:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-20T11:00:00.000Z' },
    { id: 5, name: 'Umbrian Black Truffle Paste', sku: 'ING-TRF-005', unit: 'kg', current_stock: 2.4, min_reorder_level: 4.0, cost_per_unit: 4200, supplier_name: 'Gourmet Italia Fine Foods', last_restocked_at: '2026-10-10T10:15:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-10T10:15:00.000Z' },
    { id: 6, name: 'Artisanal Cupped Pepperoni', sku: 'ING-PEP-006', unit: 'kg', current_stock: 6.2, min_reorder_level: 10.0, cost_per_unit: 890, supplier_name: 'Continental Charcuterie Works', last_restocked_at: '2026-10-18T14:00:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-18T14:00:00.000Z' },
    { id: 7, name: 'Smoked BBQ Chicken Breast', sku: 'ING-CHK-007', unit: 'kg', current_stock: 22.0, min_reorder_level: 10.0, cost_per_unit: 460, supplier_name: 'Prime Harvest Poultry', last_restocked_at: '2026-10-29T08:00:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-29T08:00:00.000Z' },
    { id: 8, name: 'Fresh Malai Paneer Block', sku: 'ING-PNR-008', unit: 'kg', current_stock: 16.5, min_reorder_level: 8.0, cost_per_unit: 380, supplier_name: 'Sahyadri Dairy Farms', last_restocked_at: '2026-10-30T06:30:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-30T06:30:00.000Z' },
    { id: 9, name: 'Roasted Cremini & Shiitake Mix', sku: 'ING-MSH-009', unit: 'kg', current_stock: 14.0, min_reorder_level: 6.0, cost_per_unit: 340, supplier_name: 'GreenValley Hydroponics', last_restocked_at: '2026-10-27T09:30:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-27T09:30:00.000Z' },
    { id: 10, name: 'Fresh Sweet Organic Basil', sku: 'ING-BSL-010', unit: 'kg', current_stock: 1.8, min_reorder_level: 3.0, cost_per_unit: 260, supplier_name: 'GreenValley Hydroponics', last_restocked_at: '2026-10-29T07:00:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-29T07:00:00.000Z' },
    { id: 11, name: 'Greek Kalamata Olives (Pitted)', sku: 'ING-OLV-011', unit: 'kg', current_stock: 11.2, min_reorder_level: 5.0, cost_per_unit: 640, supplier_name: 'Mediterranean Oils Co.', last_restocked_at: '2026-10-15T12:00:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-15T12:00:00.000Z' },
    { id: 12, name: 'Pickled Jalapeno Slices', sku: 'ING-JAL-012', unit: 'kg', current_stock: 13.5, min_reorder_level: 5.0, cost_per_unit: 220, supplier_name: 'SpiceCraft Condiments', last_restocked_at: '2026-10-22T15:00:00.000Z', created_at: '2026-06-01T09:00:00.000Z', updated_at: '2026-10-22T15:00:00.000Z' },
  ],
  pizza_ingredients: [
    { id: 1, pizza_id: 1, ingredient_id: 1, quantity_required: 0.25 },
    { id: 2, pizza_id: 1, ingredient_id: 2, quantity_required: 0.12 },
    { id: 3, pizza_id: 1, ingredient_id: 3, quantity_required: 0.15 },
    { id: 4, pizza_id: 1, ingredient_id: 10, quantity_required: 0.02 },
    { id: 5, pizza_id: 2, ingredient_id: 1, quantity_required: 0.25 },
    { id: 6, pizza_id: 2, ingredient_id: 2, quantity_required: 0.12 },
    { id: 7, pizza_id: 2, ingredient_id: 3, quantity_required: 0.15 },
    { id: 8, pizza_id: 2, ingredient_id: 9, quantity_required: 0.08 },
    { id: 9, pizza_id: 3, ingredient_id: 1, quantity_required: 0.25 },
    { id: 10, pizza_id: 3, ingredient_id: 3, quantity_required: 0.22 },
    { id: 11, pizza_id: 4, ingredient_id: 1, quantity_required: 0.25 },
    { id: 12, pizza_id: 4, ingredient_id: 11, quantity_required: 0.06 },
    { id: 13, pizza_id: 5, ingredient_id: 1, quantity_required: 0.25 },
    { id: 14, pizza_id: 5, ingredient_id: 3, quantity_required: 0.16 },
    { id: 15, pizza_id: 5, ingredient_id: 5, quantity_required: 0.04 },
    { id: 16, pizza_id: 5, ingredient_id: 9, quantity_required: 0.12 },
    { id: 17, pizza_id: 6, ingredient_id: 1, quantity_required: 0.25 },
    { id: 18, pizza_id: 6, ingredient_id: 3, quantity_required: 0.18 },
    { id: 19, pizza_id: 6, ingredient_id: 10, quantity_required: 0.05 },
    { id: 20, pizza_id: 7, ingredient_id: 1, quantity_required: 0.25 },
    { id: 21, pizza_id: 7, ingredient_id: 7, quantity_required: 0.14 },
    { id: 22, pizza_id: 8, ingredient_id: 1, quantity_required: 0.25 },
    { id: 23, pizza_id: 8, ingredient_id: 4, quantity_required: 0.03 },
    { id: 24, pizza_id: 9, ingredient_id: 1, quantity_required: 0.25 },
    { id: 25, pizza_id: 9, ingredient_id: 8, quantity_required: 0.15 },
    { id: 26, pizza_id: 10, ingredient_id: 1, quantity_required: 0.25 },
    { id: 27, pizza_id: 10, ingredient_id: 6, quantity_required: 0.12 },
    { id: 28, pizza_id: 10, ingredient_id: 12, quantity_required: 0.04 },
    { id: 29, pizza_id: 11, ingredient_id: 1, quantity_required: 0.25 },
    { id: 30, pizza_id: 11, ingredient_id: 12, quantity_required: 0.06 },
    { id: 31, pizza_id: 12, ingredient_id: 1, quantity_required: 0.25 },
    { id: 32, pizza_id: 12, ingredient_id: 7, quantity_required: 0.16 },
    { id: 33, pizza_id: 13, ingredient_id: 1, quantity_required: 0.25 },
    { id: 34, pizza_id: 13, ingredient_id: 3, quantity_required: 0.16 },
    { id: 35, pizza_id: 13, ingredient_id: 6, quantity_required: 0.16 },
    { id: 36, pizza_id: 14, ingredient_id: 1, quantity_required: 0.25 },
    { id: 37, pizza_id: 14, ingredient_id: 7, quantity_required: 0.16 },
    { id: 38, pizza_id: 15, ingredient_id: 1, quantity_required: 0.25 },
    { id: 39, pizza_id: 15, ingredient_id: 6, quantity_required: 0.10 },
    { id: 40, pizza_id: 15, ingredient_id: 7, quantity_required: 0.12 },
    { id: 41, pizza_id: 16, ingredient_id: 1, quantity_required: 0.25 },
    { id: 42, pizza_id: 16, ingredient_id: 7, quantity_required: 0.15 },
  ],
  orders: [
    { id: 1, order_number: 'PH-2026-1001', user_id: 2, address_id: 1, delivery_address_snapshot: 'Flat 402, Emerald Heights, Linking Road, Bandra West, Mumbai 400050', customer_phone: '+91-9876543210', order_status: 'Delivered', payment_method: 'Online', payment_status: 'Completed', subtotal: 1118, tax_amount: 55.9, delivery_fee: 0, discount_amount: 100, final_amount: 1073.9, coupon_code: 'WELCOME100', special_instructions: 'Extra crispy crust please.', stock_deducted: 1, cancelled_reason: null, delivered_at: '2026-06-15T20:15:00.000Z', created_at: '2026-06-15T19:35:00.000Z', updated_at: '2026-06-15T20:15:00.000Z' },
    { id: 2, order_number: 'PH-2026-1002', user_id: 3, address_id: 3, delivery_address_snapshot: 'Villa 14, Palm Meadows, Whitefield Main Road, Bengaluru 560066', customer_phone: '+91-9811223344', order_status: 'Delivered', payment_method: 'Online', payment_status: 'Completed', subtotal: 1458, tax_amount: 72.9, delivery_fee: 0, discount_amount: 0, final_amount: 1530.9, coupon_code: null, special_instructions: 'Ring doorbell once.', stock_deducted: 1, cancelled_reason: null, delivered_at: '2026-07-10T21:05:00.000Z', created_at: '2026-07-10T20:22:00.000Z', updated_at: '2026-07-10T21:05:00.000Z' },
    { id: 3, order_number: 'PH-2026-1003', user_id: 4, address_id: 4, delivery_address_snapshot: 'B-104, Symphony Park, Baner-Pashan Link Road, Pune 411045', customer_phone: '+91-9765432109', order_status: 'Delivered', payment_method: 'COD', payment_status: 'Completed', subtotal: 898, tax_amount: 44.9, delivery_fee: 0, discount_amount: 0, final_amount: 942.9, coupon_code: null, special_instructions: null, stock_deducted: 1, cancelled_reason: null, delivered_at: '2026-08-04T14:10:00.000Z', created_at: '2026-08-04T13:30:00.000Z', updated_at: '2026-08-04T14:10:00.000Z' },
    { id: 4, order_number: 'PH-2026-1004', user_id: 5, address_id: 5, delivery_address_snapshot: 'House 28, Sector 15 Part II, Civil Lines, Gurugram 122001', customer_phone: '+91-9988776655', order_status: 'Delivered', payment_method: 'Online', payment_status: 'Completed', subtotal: 1667, tax_amount: 83.35, delivery_fee: 0, discount_amount: 150, final_amount: 1600.35, coupon_code: 'FEAST150', special_instructions: 'Include extra chili flakes and oregano packets.', stock_deducted: 1, cancelled_reason: null, delivered_at: '2026-08-22T20:50:00.000Z', created_at: '2026-08-22T20:10:00.000Z', updated_at: '2026-08-22T20:50:00.000Z' },
    { id: 5, order_number: 'PH-2026-1005', user_id: 2, address_id: 2, delivery_address_snapshot: 'Level 8, One BKC Tower C, Bandra Kurla Complex, Mumbai 400051', customer_phone: '+91-9876543210', order_status: 'Delivered', payment_method: 'Online', payment_status: 'Completed', subtotal: 1398, tax_amount: 69.9, delivery_fee: 0, discount_amount: 0, final_amount: 1467.9, coupon_code: null, special_instructions: 'Leave at reception desk.', stock_deducted: 1, cancelled_reason: null, delivered_at: '2026-09-09T13:45:00.000Z', created_at: '2026-09-09T13:05:00.000Z', updated_at: '2026-09-09T13:45:00.000Z' },
    { id: 6, order_number: 'PH-2026-1006', user_id: 6, address_id: 6, delivery_address_snapshot: '701, Sea Breeze Apartments, Worli Sea Face, Mumbai 400030', customer_phone: '+91-9123456780', order_status: 'Delivered', payment_method: 'COD', payment_status: 'Completed', subtotal: 1538, tax_amount: 76.9, delivery_fee: 0, discount_amount: 0, final_amount: 1614.9, coupon_code: null, special_instructions: null, stock_deducted: 1, cancelled_reason: null, delivered_at: '2026-09-25T21:20:00.000Z', created_at: '2026-09-25T20:40:00.000Z', updated_at: '2026-09-25T21:20:00.000Z' },
    { id: 7, order_number: 'PH-2026-1007', user_id: 7, address_id: 7, delivery_address_snapshot: '302, Silver Oak Residency, Koregaon Park Lane 6, Pune 411001', customer_phone: '+91-9345678901', order_status: 'Delivered', payment_method: 'Online', payment_status: 'Completed', subtotal: 1238, tax_amount: 61.9, delivery_fee: 0, discount_amount: 0, final_amount: 1299.9, coupon_code: null, special_instructions: 'Cut into 8 slices.', stock_deducted: 1, cancelled_reason: null, delivered_at: '2026-10-08T19:55:00.000Z', created_at: '2026-10-08T19:15:00.000Z', updated_at: '2026-10-08T19:55:00.000Z' },
    { id: 8, order_number: 'PH-2026-1008', user_id: 3, address_id: 8, delivery_address_snapshot: '2nd Floor, Indiranagar 100 Feet Road, Bengaluru 560038', customer_phone: '+91-9811223344', order_status: 'Delivered', payment_method: 'Online', payment_status: 'Completed', subtotal: 1847, tax_amount: 92.35, delivery_fee: 0, discount_amount: 150, final_amount: 1789.35, coupon_code: 'FEAST150', special_instructions: null, stock_deducted: 1, cancelled_reason: null, delivered_at: '2026-10-21T20:30:00.000Z', created_at: '2026-10-21T19:48:00.000Z', updated_at: '2026-10-21T20:30:00.000Z' },
    { id: 9, order_number: 'PH-2026-1009', user_id: 4, address_id: 4, delivery_address_snapshot: 'B-104, Symphony Park, Baner-Pashan Link Road, Pune 411045', customer_phone: '+91-9765432109', order_status: 'Cancelled', payment_method: 'COD', payment_status: 'Failed', subtotal: 589, tax_amount: 29.45, delivery_fee: 0, discount_amount: 0, final_amount: 618.45, coupon_code: null, special_instructions: null, stock_deducted: 0, cancelled_reason: 'Customer changed delivery schedule.', delivered_at: null, created_at: '2026-10-28T18:10:00.000Z', updated_at: '2026-10-28T18:20:00.000Z' },
    { id: 10, order_number: 'PH-2026-1010', user_id: 5, address_id: 5, delivery_address_snapshot: 'House 28, Sector 15 Part II, Civil Lines, Gurugram 122001', customer_phone: '+91-9988776655', order_status: 'Out for Delivery', payment_method: 'Online', payment_status: 'Completed', subtotal: 1318, tax_amount: 65.9, delivery_fee: 0, discount_amount: 0, final_amount: 1383.9, coupon_code: null, special_instructions: 'Call upon arrival at gate.', stock_deducted: 1, cancelled_reason: null, delivered_at: null, created_at: '2026-11-02T12:15:00.000Z', updated_at: '2026-11-02T12:35:00.000Z' },
    { id: 11, order_number: 'PH-2026-1011', user_id: 2, address_id: 1, delivery_address_snapshot: 'Flat 402, Emerald Heights, Linking Road, Bandra West, Mumbai 400050', customer_phone: '+91-9876543210', order_status: 'Preparing', payment_method: 'Online', payment_status: 'Completed', subtotal: 1473, tax_amount: 73.65, delivery_fee: 0, discount_amount: 100, final_amount: 1446.65, coupon_code: 'WELCOME100', special_instructions: 'Extra basil on the Margherita.', stock_deducted: 1, cancelled_reason: null, delivered_at: null, created_at: '2026-11-02T13:10:00.000Z', updated_at: '2026-11-02T13:20:00.000Z' },
    { id: 12, order_number: 'PH-2026-1012', user_id: 6, address_id: 6, delivery_address_snapshot: '701, Sea Breeze Apartments, Worli Sea Face, Mumbai 400030', customer_phone: '+91-9123456780', order_status: 'Pending', payment_method: 'COD', payment_status: 'Pending', subtotal: 949, tax_amount: 47.45, delivery_fee: 0, discount_amount: 0, final_amount: 996.45, coupon_code: null, special_instructions: 'Include garlic dip.', stock_deducted: 1, cancelled_reason: null, delivered_at: null, created_at: '2026-11-02T13:40:00.000Z', updated_at: '2026-11-02T13:40:00.000Z' },
  ],
  order_items: [
    { id: 1, order_id: 1, pizza_id: 1, pizza_size_id: 2, pizza_name_snapshot: 'Margherita Classica DOP', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 449, toppings_unit_price: 0, line_total: 449, created_at: '2026-06-15T19:35:00.000Z' },
    { id: 2, order_id: 1, pizza_id: 13, pizza_size_id: 38, pizza_name_snapshot: 'Double Pepperoni Feast', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 669, toppings_unit_price: 0, line_total: 669, created_at: '2026-06-15T19:35:00.000Z' },
    { id: 3, order_id: 2, pizza_id: 5, pizza_size_id: 14, pizza_name_snapshot: 'Black Truffle & Wild Mushroom', size_name_snapshot: 'Medium', quantity: 2, unit_base_price: 729, toppings_unit_price: 0, line_total: 1458, created_at: '2026-07-10T20:22:00.000Z' },
    { id: 4, order_id: 3, pizza_id: 1, pizza_size_id: 2, pizza_name_snapshot: 'Margherita Classica DOP', size_name_snapshot: 'Medium', quantity: 2, unit_base_price: 449, toppings_unit_price: 0, line_total: 898, created_at: '2026-08-04T13:30:00.000Z' },
    { id: 5, order_id: 4, pizza_id: 15, pizza_size_id: 45, pizza_name_snapshot: 'Sicilian Meat Lovers Supreme', size_name_snapshot: 'Large', quantity: 1, unit_base_price: 949, toppings_unit_price: 95, line_total: 1044, created_at: '2026-08-22T20:10:00.000Z' },
    { id: 6, order_id: 4, pizza_id: 9, pizza_size_id: 26, pizza_name_snapshot: 'Fiery Peri-Peri Paneer', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 589, toppings_unit_price: 34, line_total: 623, created_at: '2026-08-22T20:10:00.000Z' },
    { id: 7, order_id: 5, pizza_id: 6, pizza_size_id: 17, pizza_name_snapshot: 'Genovese Pesto & Burrata', size_name_snapshot: 'Medium', quantity: 2, unit_base_price: 699, toppings_unit_price: 0, line_total: 1398, created_at: '2026-09-09T13:05:00.000Z' },
    { id: 8, order_id: 6, pizza_id: 15, pizza_size_id: 44, pizza_name_snapshot: 'Sicilian Meat Lovers Supreme', size_name_snapshot: 'Medium', quantity: 2, unit_base_price: 769, toppings_unit_price: 0, line_total: 1538, created_at: '2026-09-25T20:40:00.000Z' },
    { id: 9, order_id: 7, pizza_id: 14, pizza_size_id: 41, pizza_name_snapshot: 'Hickory Smoked BBQ Chicken', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 639, toppings_unit_price: 0, line_total: 639, created_at: '2026-10-08T19:15:00.000Z' },
    { id: 10, order_id: 7, pizza_id: 3, pizza_size_id: 8, pizza_name_snapshot: 'Quattro Formaggi Gold', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 599, toppings_unit_price: 0, line_total: 599, created_at: '2026-10-08T19:15:00.000Z' },
    { id: 11, order_id: 8, pizza_id: 10, pizza_size_id: 30, pizza_name_snapshot: 'Calabrian Diavola Hot Honey', size_name_snapshot: 'Large', quantity: 1, unit_base_price: 849, toppings_unit_price: 50, line_total: 899, created_at: '2026-10-21T19:48:00.000Z' },
    { id: 12, order_id: 8, pizza_id: 5, pizza_size_id: 15, pizza_name_snapshot: 'Black Truffle & Wild Mushroom', size_name_snapshot: 'Large', quantity: 1, unit_base_price: 899, toppings_unit_price: 49, line_total: 948, created_at: '2026-10-21T19:48:00.000Z' },
    { id: 13, order_id: 9, pizza_id: 9, pizza_size_id: 26, pizza_name_snapshot: 'Fiery Peri-Peri Paneer', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 589, toppings_unit_price: 0, line_total: 589, created_at: '2026-10-28T18:10:00.000Z' },
    { id: 14, order_id: 10, pizza_id: 12, pizza_size_id: 35, pizza_name_snapshot: 'Smoky Tandoori Chicken Tikka', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 649, toppings_unit_price: 0, line_total: 649, created_at: '2026-11-02T12:15:00.000Z' },
    { id: 15, order_id: 10, pizza_id: 13, pizza_size_id: 38, pizza_name_snapshot: 'Double Pepperoni Feast', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 669, toppings_unit_price: 0, line_total: 669, created_at: '2026-11-02T12:15:00.000Z' },
    { id: 16, order_id: 11, pizza_id: 5, pizza_size_id: 14, pizza_name_snapshot: 'Black Truffle & Wild Mushroom', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 729, toppings_unit_price: 75, line_total: 804, created_at: '2026-11-02T13:10:00.000Z' },
    { id: 17, order_id: 11, pizza_id: 13, pizza_size_id: 38, pizza_name_snapshot: 'Double Pepperoni Feast', size_name_snapshot: 'Medium', quantity: 1, unit_base_price: 669, toppings_unit_price: 0, line_total: 669, created_at: '2026-11-02T13:10:00.000Z' },
    { id: 18, order_id: 12, pizza_id: 15, pizza_size_id: 45, pizza_name_snapshot: 'Sicilian Meat Lovers Supreme', size_name_snapshot: 'Large', quantity: 1, unit_base_price: 949, toppings_unit_price: 0, line_total: 949, created_at: '2026-11-02T13:40:00.000Z' },
  ],
  order_item_toppings: [
    { id: 1, order_item_id: 5, topping_id: 8, topping_name_snapshot: 'Crispy Cupped Pepperoni', price_snapshot: 95 },
    { id: 2, order_item_id: 11, topping_id: 10, topping_name_snapshot: 'Wildflower Hot Honey Drizzle', price_snapshot: 50 },
    { id: 3, order_item_id: 16, topping_id: 1, topping_name_snapshot: 'Extra Fior di Latte Mozzarella', price_snapshot: 75 },
  ],
  payments: [
    { id: 1, order_id: 1, transaction_reference: 'TXN-PH-20260615-001', payment_method: 'Online', payment_gateway: 'Razorpay_UPI', amount: 1073.9, payment_status: 'Completed', paid_at: '2026-06-15T19:36:10.000Z', created_at: '2026-06-15T19:35:00.000Z', updated_at: '2026-06-15T19:36:10.000Z' },
    { id: 2, order_id: 2, transaction_reference: 'TXN-PH-20260710-002', payment_method: 'Online', payment_gateway: 'Razorpay_Card', amount: 1530.9, payment_status: 'Completed', paid_at: '2026-07-10T20:23:05.000Z', created_at: '2026-07-10T20:22:00.000Z', updated_at: '2026-07-10T20:23:05.000Z' },
    { id: 3, order_id: 3, transaction_reference: 'TXN-PH-20260804-003', payment_method: 'COD', payment_gateway: 'Cash_On_Delivery', amount: 942.9, payment_status: 'Completed', paid_at: '2026-08-04T14:10:00.000Z', created_at: '2026-08-04T13:30:00.000Z', updated_at: '2026-08-04T14:10:00.000Z' },
    { id: 4, order_id: 4, transaction_reference: 'TXN-PH-20260822-004', payment_method: 'Online', payment_gateway: 'Razorpay_UPI', amount: 1600.35, payment_status: 'Completed', paid_at: '2026-08-22T20:11:00.000Z', created_at: '2026-08-22T20:10:00.000Z', updated_at: '2026-08-22T20:11:00.000Z' },
    { id: 5, order_id: 5, transaction_reference: 'TXN-PH-20260909-005', payment_method: 'Online', payment_gateway: 'Razorpay_Card', amount: 1467.9, payment_status: 'Completed', paid_at: '2026-09-09T13:06:12.000Z', created_at: '2026-09-09T13:05:00.000Z', updated_at: '2026-09-09T13:06:12.000Z' },
    { id: 6, order_id: 6, transaction_reference: 'TXN-PH-20260925-006', payment_method: 'COD', payment_gateway: 'Cash_On_Delivery', amount: 1614.9, payment_status: 'Completed', paid_at: '2026-09-25T21:20:00.000Z', created_at: '2026-09-25T20:40:00.000Z', updated_at: '2026-09-25T21:20:00.000Z' },
    { id: 7, order_id: 7, transaction_reference: 'TXN-PH-20261008-007', payment_method: 'Online', payment_gateway: 'Razorpay_UPI', amount: 1299.9, payment_status: 'Completed', paid_at: '2026-10-08T19:16:00.000Z', created_at: '2026-10-08T19:15:00.000Z', updated_at: '2026-10-08T19:16:00.000Z' },
    { id: 8, order_id: 8, transaction_reference: 'TXN-PH-20261021-008', payment_method: 'Online', payment_gateway: 'Razorpay_NetBanking', amount: 1789.35, payment_status: 'Completed', paid_at: '2026-10-21T19:49:10.000Z', created_at: '2026-10-21T19:48:00.000Z', updated_at: '2026-10-21T19:49:10.000Z' },
    { id: 9, order_id: 9, transaction_reference: 'TXN-PH-20261028-009', payment_method: 'COD', payment_gateway: 'Cash_On_Delivery', amount: 618.45, payment_status: 'Failed', paid_at: null, created_at: '2026-10-28T18:10:00.000Z', updated_at: '2026-10-28T18:20:00.000Z' },
    { id: 10, order_id: 10, transaction_reference: 'TXN-PH-20261102-010', payment_method: 'Online', payment_gateway: 'Razorpay_UPI', amount: 1383.9, payment_status: 'Completed', paid_at: '2026-11-02T12:16:00.000Z', created_at: '2026-11-02T12:15:00.000Z', updated_at: '2026-11-02T12:16:00.000Z' },
    { id: 11, order_id: 11, transaction_reference: 'TXN-PH-20261102-011', payment_method: 'Online', payment_gateway: 'Razorpay_Card', amount: 1446.65, payment_status: 'Completed', paid_at: '2026-11-02T13:11:00.000Z', created_at: '2026-11-02T13:10:00.000Z', updated_at: '2026-11-02T13:11:00.000Z' },
    { id: 12, order_id: 12, transaction_reference: 'TXN-PH-20261102-012', payment_method: 'COD', payment_gateway: 'Cash_On_Delivery', amount: 996.45, payment_status: 'Pending', paid_at: null, created_at: '2026-11-02T13:40:00.000Z', updated_at: '2026-11-02T13:40:00.000Z' },
  ],
  inventory_transactions: [
    { id: 1, ingredient_id: 1, order_id: null, transaction_type: 'RESTOCK', quantity_change: 50.0, stock_before: 35.5, stock_after: 85.5, notes: 'Monthly bulk Caputo 00 flour delivery', performed_by: 1, created_at: '2026-10-25T08:30:00.000Z' },
    { id: 2, ingredient_id: 3, order_id: null, transaction_type: 'RESTOCK', quantity_change: 25.0, stock_before: 13.62, stock_after: 38.62, notes: 'Fresh mozzarella batch #MZ-409', performed_by: 1, created_at: '2026-10-28T07:45:00.000Z' },
    { id: 3, ingredient_id: 5, order_id: 8, transaction_type: 'ORDER_DEDUCTION', quantity_change: -0.04, stock_before: 2.48, stock_after: 2.44, notes: 'Auto-deducted for Order PH-2026-1008', performed_by: null, created_at: '2026-10-21T19:48:05.000Z' },
    { id: 4, ingredient_id: 6, order_id: 10, transaction_type: 'ORDER_DEDUCTION', quantity_change: -0.16, stock_before: 6.52, stock_after: 6.36, notes: 'Auto-deducted for Order PH-2026-1010', performed_by: null, created_at: '2026-11-02T12:15:05.000Z' },
    { id: 5, ingredient_id: 5, order_id: 11, transaction_type: 'ORDER_DEDUCTION', quantity_change: -0.04, stock_before: 2.44, stock_after: 2.4, notes: 'Auto-deducted for Order PH-2026-1011', performed_by: null, created_at: '2026-11-02T13:10:05.000Z' },
    { id: 6, ingredient_id: 6, order_id: 11, transaction_type: 'ORDER_DEDUCTION', quantity_change: -0.16, stock_before: 6.36, stock_after: 6.2, notes: 'Auto-deducted for Order PH-2026-1011', performed_by: null, created_at: '2026-11-02T13:10:06.000Z' },
    { id: 7, ingredient_id: 1, order_id: 12, transaction_type: 'ORDER_DEDUCTION', quantity_change: -0.25, stock_before: 85.25, stock_after: 85.0, notes: 'Auto-deducted for Order PH-2026-1012', performed_by: null, created_at: '2026-11-02T13:40:05.000Z' },
    { id: 8, ingredient_id: 3, order_id: 12, transaction_type: 'ORDER_DEDUCTION', quantity_change: -0.16, stock_before: 38.16, stock_after: 38.0, notes: 'Auto-deducted for Order PH-2026-1012', performed_by: null, created_at: '2026-11-02T13:40:06.000Z' },
  ],
};

// Also execute SQL on connected external MySQL 8 server whenever connected
export async function executeOnMySQLIfConnected(sql: string, params: any[] = []): Promise<any | null> {
  const connState = getLastConnectionState();
  if (!connState.connected) return null;
  try {
    const poolInstance = getPool();
    if (!poolInstance) return null;
    const [rows] = await poolInstance.execute(sql, params);
    return rows;
  } catch (err) {
    console.warn('[MySQL Query Warning]:', (err as Error).message);
    return null;
  }
}

export function getEnrichedPizza(pizza: PizzaRow) {
  const category = dbState.categories.find((c) => c.id === pizza.category_id);
  const sizes = dbState.pizza_sizes
    .filter((s) => s.pizza_id === pizza.id)
    .sort((a, b) => a.diameter_inches - b.diameter_inches);
  const defaultToppingIds = dbState.pizza_toppings
    .filter((pt) => pt.pizza_id === pizza.id)
    .map((pt) => pt.topping_id);
  const defaultToppings = dbState.toppings.filter((t) => defaultToppingIds.includes(t.id));
  const recipe = dbState.pizza_ingredients
    .filter((pi) => pi.pizza_id === pizza.id)
    .map((pi) => {
      const ing = dbState.ingredients.find((i) => i.id === pi.ingredient_id);
      return {
        ingredient_id: pi.ingredient_id,
        ingredient_name: ing?.name || 'Ingredient',
        unit: ing?.unit || 'kg',
        quantity_required: pi.quantity_required,
      };
    });

  return {
    ...pizza,
    category_name: category?.name || 'Uncategorized',
    category_slug: category?.slug || 'uncategorized',
    sizes,
    default_toppings: defaultToppings,
    recipe,
  };
}

export function getEnrichedOrder(order: OrderRow) {
  const user = dbState.users.find((u) => u.id === order.user_id);
  const items = dbState.order_items
    .filter((oi) => oi.order_id === order.id)
    .map((oi) => {
      const pizza = dbState.pizzas.find((p) => p.id === oi.pizza_id);
      const toppings = dbState.order_item_toppings.filter((oit) => oit.order_item_id === oi.id);
      return {
        ...oi,
        image_url:
          pizza?.image_url ||
          'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1400&q=85',
        is_veg: pizza?.is_veg ?? 1,
        toppings,
      };
    });
  const payment = dbState.payments.find((p) => p.order_id === order.id) || null;

  return {
    ...order,
    customer_name: user?.full_name || 'Guest Customer',
    customer_email: user?.email || '',
    items,
    payment,
    total_pizza_count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function getSqlScriptContents() {
  const files = [
    'schema.sql',
    'seed.sql',
    'queries.sql',
    'procedures.sql',
    'views.sql',
    'triggers.sql',
    'transactions.sql',
  ];
  const result: Record<string, string> = {};
  for (const file of files) {
    try {
      result[file] = fs.readFileSync(path.join(process.cwd(), 'database', file), 'utf8');
    } catch {
      result[file] = `-- Unable to read database/${file}`;
    }
  }
  return result;
}
