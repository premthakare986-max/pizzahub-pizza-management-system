import React, { createContext, useContext, useState, useMemo } from 'react';
import { Pizza, PizzaSize, Topping, CartItem } from '../types/index.ts';

interface CartContextValue {
  items: CartItem[];
  couponCode: string | null;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  finalAmount: number;
  totalItemsCount: number;
  addToCart: (pizza: Pizza, size: PizzaSize, toppings: Topping[], quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  applyCoupon: (code: string) => { valid: boolean; message: string };
  removeCoupon: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const addToCart = (
    pizza: Pizza,
    size: PizzaSize,
    toppings: Topping[],
    quantity: number = 1
  ) => {
    const sortedToppingIds = [...toppings].map((t) => t.id).sort((a, b) => a - b);
    const cartItemId = `${pizza.id}-${size.id}-${sortedToppingIds.join('_')}`;
    const toppingsUnitPrice = toppings.reduce((sum, t) => sum + t.price, 0);
    const unitBasePrice = size.price;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          lineTotal: Number(((unitBasePrice + toppingsUnitPrice) * newQty).toFixed(2)),
        };
        return updated;
      }
      return [
        ...prev,
        {
          cartItemId,
          pizza,
          selectedSize: size,
          selectedToppings: toppings,
          quantity,
          unitBasePrice,
          toppingsUnitPrice,
          lineTotal: Number(((unitBasePrice + toppingsUnitPrice) * quantity).toFixed(2)),
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId !== cartItemId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          return {
            ...item,
            quantity: nextQty,
            lineTotal: Number(
              ((item.unitBasePrice + item.toppingsUnitPrice) * nextQty).toFixed(2)
            ),
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = useMemo(
    () => Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)),
    [items]
  );

  const taxAmount = useMemo(() => Number((subtotal * 0.05).toFixed(2)), [subtotal]);

  const deliveryFee = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= 500 ? 0 : 49;
  }, [subtotal]);

  const discountAmount = useMemo(() => {
    if (!couponCode || subtotal === 0) return 0;
    const code = couponCode.toUpperCase();
    if (code === 'WELCOME100' && subtotal >= 400) return 100;
    if (code === 'FEAST150' && subtotal >= 900) return 150;
    if (code === 'PIZZA20' && subtotal >= 600) {
      return Math.min(250, Number((subtotal * 0.2).toFixed(2)));
    }
    return 0;
  }, [couponCode, subtotal]);

  const finalAmount = useMemo(
    () => Math.max(0, Number((subtotal + taxAmount + deliveryFee - discountAmount).toFixed(2))),
    [subtotal, taxAmount, deliveryFee, discountAmount]
  );

  const totalItemsCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const applyCoupon = (rawCode: string): { valid: boolean; message: string } => {
    const code = rawCode.trim().toUpperCase();
    if (code === 'WELCOME100') {
      if (subtotal < 400) {
        return { valid: false, message: 'WELCOME100 requires a minimum subtotal of ₹400.' };
      }
      setCouponCode('WELCOME100');
      return { valid: true, message: 'WELCOME100 applied! ₹100 discount added.' };
    }
    if (code === 'FEAST150') {
      if (subtotal < 900) {
        return { valid: false, message: 'FEAST150 requires a minimum subtotal of ₹900.' };
      }
      setCouponCode('FEAST150');
      return { valid: true, message: 'FEAST150 applied! ₹150 discount added.' };
    }
    if (code === 'PIZZA20') {
      if (subtotal < 600) {
        return { valid: false, message: 'PIZZA20 requires a minimum subtotal of ₹600.' };
      }
      setCouponCode('PIZZA20');
      return { valid: true, message: 'PIZZA20 applied! 20% off (up to ₹250).' };
    }
    return {
      valid: false,
      message: 'Invalid coupon code. Try WELCOME100, FEAST150, or PIZZA20.',
    };
  };

  const removeCoupon = () => setCouponCode(null);

  const clearCart = () => {
    setItems([]);
    setCouponCode(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        couponCode,
        subtotal,
        taxAmount,
        deliveryFee,
        discountAmount,
        finalAmount,
        totalItemsCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        applyCoupon,
        removeCoupon,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
