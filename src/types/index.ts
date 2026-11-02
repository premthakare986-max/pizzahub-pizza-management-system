export interface Address {
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
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  mobile_number?: string;
  role: 'customer' | 'admin';
  created_at: string;
  addresses?: Address[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: number;
  pizza_count?: number;
}

export interface PizzaSize {
  id: number;
  pizza_id: number;
  size_name: 'Regular' | 'Medium' | 'Large';
  size_code: string;
  diameter_inches: number;
  price: number;
  is_available: number;
}

export interface Topping {
  id: number;
  name: string;
  category: 'Veg' | 'Non-Veg' | 'Cheese' | 'Herb & Spice';
  price: number;
  is_veg: number;
  is_available: number;
}

export interface PizzaRecipeItem {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  quantity_required: number;
}

export interface Pizza {
  id: number;
  category_id: number;
  category_name: string;
  category_slug: string;
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
  sizes: PizzaSize[];
  default_toppings: Topping[];
  recipe?: PizzaRecipeItem[];
}

export interface CartItem {
  cartItemId: string;
  pizza: Pizza;
  selectedSize: PizzaSize;
  selectedToppings: Topping[];
  quantity: number;
  unitBasePrice: number;
  toppingsUnitPrice: number;
  lineTotal: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItemTopping {
  id: number;
  order_item_id: number;
  topping_id: number;
  topping_name_snapshot: string;
  price_snapshot: number;
}

export interface OrderItem {
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
  image_url?: string;
  is_veg?: number;
  toppings: OrderItemTopping[];
}

export interface Payment {
  id: number;
  order_id: number;
  transaction_reference: string;
  payment_method: 'COD' | 'Online';
  payment_gateway: string;
  amount: number;
  payment_status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  paid_at: string | null;
  created_at: string;
  order_number?: string;
  order_status?: OrderStatus;
  customer_name?: string;
  customer_email?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  address_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address_snapshot: string;
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
  cancelled_reason: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  payment: Payment | null;
  total_pizza_count: number;
}

export interface Ingredient {
  id: number;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
  min_reorder_level: number;
  cost_per_unit: number;
  supplier_name: string;
  last_restocked_at: string;
  is_low_stock?: boolean;
  shortage_amount?: number;
  stock_valuation?: number;
  pizzas_using_count?: number;
}

export interface InventoryTransaction {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  sku: string;
  unit: string;
  order_id: number | null;
  order_number: string | null;
  transaction_type: 'RESTOCK' | 'ORDER_DEDUCTION' | 'ADJUSTMENT' | 'WASTAGE' | 'ORDER_REVERSAL';
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  notes: string | null;
  created_at: string;
}

export interface DBHealthResponse {
  status: 'CONNECTED' | 'NOT CONNECTED';
  service: string;
  mysql: {
    status: 'CONNECTED' | 'NOT CONNECTED';
    connected: boolean;
    configured: boolean;
    environment: 'cloud_preview' | 'local_development';
    server_version: string | null;
    error_code: string | null;
    error_message: string | null;
    checked_at: string;
    config: {
      host: string;
      port: number;
      user: string;
      database: string;
      hasPassword: boolean;
    };
  };
  schema_stats: {
    tables_count: number;
    users: number;
    categories: number;
    pizzas: number;
    pizza_sizes: number;
    toppings: number;
    ingredients: number;
    orders: number;
  };
}

