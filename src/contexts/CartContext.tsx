import { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "@/data/products";
import { useAuth } from "./AuthContext";

interface CartItem extends Product {
  id: number;
  quantity: number;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  // identify items by product id (size removed)
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  removeItems: (items: { productId: number }[]) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { requireAuth, user } = useAuth();

  // keep cart per-user in localStorage using `vasa-cart-<userId>` key
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart when user changes (or on mount)
  useEffect(() => {
    try {
      if (user && user.id !== undefined && user.id !== null) {
        const key = `vasa-cart-${user.id}`;
        // migrate legacy cart saved under `vasa-cart` (if present)
        const legacy = localStorage.getItem('vasa-cart');
        if (legacy) {
          try {
            const legacyItems = JSON.parse(legacy);
            const existing = localStorage.getItem(key);
            if (!existing) {
              localStorage.setItem(key, JSON.stringify(legacyItems));
              localStorage.removeItem('vasa-cart');
              console.debug('[CartContext] migrated legacy cart to', key);
            }
          } catch (err) {
            console.error('[CartContext] failed to migrate legacy cart', err);
          }
        }
        const saved = localStorage.getItem(key);
        console.debug('[CartContext] loading cart for user', { key, saved });
        setItems(saved ? JSON.parse(saved) : []);
      } else {
        // no logged-in user => empty cart
        setItems([]);
      }
    } catch (err) {
      console.error('[CartContext] failed to load cart', err);
      setItems([]);
    }
  }, [user]);

  // Persist cart for current user
  useEffect(() => {
    try {
      if (user && user.id !== undefined && user.id !== null) {
        const key = `vasa-cart-${user.id}`;
        localStorage.setItem(key, JSON.stringify(items));
        console.debug('[CartContext] saved cart for user', { key, items });
      }
    } catch (err) {
      console.error('[CartContext] failed to save cart', err);
    }
  }, [items, user]);

  const addItem = (product: Product) => {
    // require a resolved user id to avoid writing into a wrong key
    if (!user || user.id === undefined || user.id === null) {
      console.warn('[CartContext] addItem aborted: user not resolved yet');
      return;
    }
    requireAuth(() => {
      setItems(current => {
        const existing = current.find(item => item.id === product.id);
        if (existing) {
          return current.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        const newItem = { ...product, quantity: 1 } as any;
        console.debug('[CartContext] adding new item to cart', { newItem });
        return [...current, newItem];
      });
    });
  };

  const removeItem = (productId: number) => {
    if (!user || user.id === undefined || user.id === null) {
      console.warn('[CartContext] removeItem aborted: user not resolved yet');
      return;
    }
    requireAuth(() => {
      // remove any items matching the product id (size removed)
      setItems(current => current.filter(item => item.id !== productId));
    });
  };

  const removeItems = (toRemove: { productId: number }[]) => {
    if (!user || user.id === undefined || user.id === null) {
      console.warn('[CartContext] removeItems aborted: user not resolved yet');
      return;
    }
    requireAuth(() => {
      if (!Array.isArray(toRemove) || toRemove.length === 0) return;
      setItems(current => current.filter(item => !toRemove.some(r => item.id === r.productId)));
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!user || user.id === undefined || user.id === null) {
      console.warn('[CartContext] updateQuantity aborted: user not resolved yet');
      return;
    }
    requireAuth(() => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setItems(current => current.map(item => item.id === productId ? { ...item, quantity } : item));
    });
  };

  const clearCart = () => {
    requireAuth(() => {
      setItems([]);
    });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, removeItems, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}