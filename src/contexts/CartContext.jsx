import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ApiClient } from '../lib/api-client';
import { useToast } from '../hooks/use-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, token } = useAuth();

  // Defensive check: detect admin tokens and skip cart calls
  const isAdminToken = (t) => {
    if (!t) return false;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return Number(payload.role_id) === 1;
    } catch (e) {
      return false;
    }
  };

  // Fetch cart items from the server
  const fetchCartItems = useCallback(async () => {
    // Skip cart calls for admin tokens
    if (isAdminToken(token)) {
      console.debug('[CartContext] admin token detected — skipping cart fetch');
      setCartItems([]);
      return;
    }

    if (!isAuthenticated || !token) {
      setCartItems([]);
      return;
    }

    try {
      const response = await ApiClient.getCart(token);
      console.log('Cart response:', response); // Debug log
      
      let updatedItems = [];
      
      if (response && Array.isArray(response.cart_items)) {
        updatedItems = response.cart_items;
      } else if (response && response.items) {
        updatedItems = response.items;
      } else if (Array.isArray(response)) {
        updatedItems = response;
      }
      
      // If server returns empty cart, check localStorage for saved items (post-checkout recovery)
      if (updatedItems.length === 0) {
        console.debug('[CartContext] Server returned empty cart, checking for localStorage backup');
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = payload.user_id;
          if (userId) {
            const cartKey = `vasa-cart-${userId}`;
            const saved = localStorage.getItem(cartKey);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                // ONLY restore checkout backups (NOT legacy persistent carts)
                // Checkout backups have { source: 'checkout', savedAt, items }
                if (parsed && parsed.source === 'checkout' && Array.isArray(parsed.items) && parsed.items.length > 0) {
                  const maxAge = 10 * 60 * 1000; // 10 minutes (increased from 5)
                  const age = Date.now() - (parsed.savedAt || 0);
                  if (age < maxAge) {
                    console.debug('[CartContext] Restoring recent checkout backup from localStorage', { 
                      cartKey, 
                      count: parsed.items.length, 
                      age_ms: age 
                    });
                    // Normalize items before setting
                    const normalizedItems = parsed.items.map(item => ({
                      perfume_id: Number(item.perfume_id),
                      perfume_name: item.perfume_name || item.name,
                      price: Number(item.price),
                      quantity: Number(item.quantity),
                      size: item.size,
                      photo_url: item.photo_url || item.image,
                      in_stock: item.in_stock !== false
                    }));
                    setCartItems(normalizedItems);
                    // DO NOT remove backup - keep it so refresh doesn't lose items
                    return;
                  } else {
                    console.debug('[CartContext] Found checkout backup but it is stale; removing', { cartKey, age_ms: age });
                    localStorage.removeItem(cartKey);
                  }
                }
                // DO NOT restore legacy format (raw array) - let server be authoritative
              } catch (innerErr) {
                console.debug('[CartContext] Failed to parse saved cart data', innerErr);
                // If parse failed, remove the corrupted entry
                try { localStorage.removeItem(cartKey); } catch(e){}
              }
            }
          }
        } catch (err) {
          console.debug('[CartContext] Failed to restore from localStorage', err);
        }
      }
      
      // Normalize the data
      const normalizedItems = updatedItems.map(item => ({
        perfume_id: Number(item.perfume_id),
        perfume_name: item.perfume_name || item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        size: item.size,
        photo_url: item.photo_url || item.image,
        in_stock: item.in_stock !== false
      }));

      console.log('Setting normalized cart items:', normalizedItems);
      setCartItems(normalizedItems);
      
    } catch (error) {
      console.error('Error fetching cart:', error);
      
      if (error.message === 'Invalid token' || error.message === 'Authentication required') {
        setCartItems([]);
        toast({
          title: 'Session Expired',
          description: 'Please log in again',
          variant: 'destructive',
        });
      }
    }
  }, [isAuthenticated, toast]);

  // Helper: clear checkout backup when user makes intentional changes
  const clearCheckoutBackup = useCallback(async () => {
    try {
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.user_id;
        if (userId) {
          const cartKey = `vasa-cart-${userId}`;
          localStorage.removeItem(cartKey);
          console.debug('[CartContext] Cleared checkout backup after user modification');
        }
      }
    } catch (err) {
      // Silently ignore
    }
  }, [token]);

  // Add item to cart
  const addItem = async (product, size) => {
    if (!isAuthenticated || !token) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to add items to cart',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Optimistically update the local cart state
      const newItem = {
        perfume_id: product.id,
        perfume_name: product.name,
        price: product.price,
        quantity: 1,
        size: size,
        photo_url: product.image,
        in_stock: true
      };
      
      setCartItems(current => [...current, newItem]);

      const res = await ApiClient.addToCart([{ 
        perfume_id: product.id, 
        quantity: 1,
        size: size
      }], token);
      
      // Fetch the latest cart state from server to ensure consistency
      await fetchCartItems();
      
      // Clear checkout backup since user modified cart
      await clearCheckoutBackup();
      
      toast({
        title: 'Success',
        description: 'Item added to cart',
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Revert the optimistic update on error
      await fetchCartItems();
      
      if (error.message === 'Invalid token' || error.message === 'Authentication required') {
        toast({
          title: 'Session Expired',
          description: 'Please log in again',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add item to cart',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (productId, size) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      console.debug('[CartContext] removeItem', { productId, size });
      
      // 1. Update local state IMMEDIATELY (optimistic update)
      setCartItems(current => 
        current.filter(item => 
          !(item.perfume_id === productId && item.size === size)
        )
      );

      // 2. Try to sync with server, but don't fail if it's not there
      try {
        await ApiClient.removeFromCart(Number(productId), token);
        console.debug('[CartContext] Server deletion successful', productId);
      } catch (err) {
        // Server says item not found? That's OK - we already removed it locally
        if (err instanceof Error && /Item not in your cart|not in your cart/i.test(err.message)) {
          console.debug('[CartContext] Item not on server (maybe checkout cleared it), but local removal is done', productId);
        } else {
          console.warn('[CartContext] Server deletion failed (unexpected error)', err);
          // Don't refetch here - trust local state
        }
      }

      toast({ title: 'Success', description: 'Item removed from cart' });
      
      // Clear checkout backup since user modified cart
      await clearCheckoutBackup();
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity
  const updateQuantity = async (productId, size, quantity) => {
    if (!isAuthenticated) return;
    if (quantity <= 0) {
      await removeItem(productId, size);
      return;
    }

    try {
      setIsLoading(true);
      console.debug('[CartContext] updateQuantity', { productId, size, quantity, token });
      
      // First update local state to maintain order
      setCartItems(current => 
        current.map(item =>
          item.perfume_id === productId && item.size === size
            ? { ...item, quantity }
            : item
        )
      );

      // First remove existing item
      await ApiClient.removeFromCart(productId, token);
      
      // Then add with new quantity - wrap perfume_id in Number() to ensure it's numeric
      const res = await ApiClient.addToCart([{
        perfume_id: Number(productId),
        quantity: Number(quantity),
        size: String(size)
      }], token);
      
      console.debug('[CartContext] updateQuantity response:', res);
      
      // Clear checkout backup since user modified cart
      await clearCheckoutBackup();
    } catch (error) {
      console.error('Error updating cart:', error);
      if (error.data) {
        console.debug('Server error details:', error.data);
      }
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to update cart',
        variant: 'destructive',
      });
      // Only refresh from server on error
      await fetchCartItems();
    } finally {
      setIsLoading(false);
    }
  };

  // Remove multiple items at once (batch remove)
  const removeItems = async (toRemove) => {
    if (!isAuthenticated) return;
    
    if (!Array.isArray(toRemove) || toRemove.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      // First remove items on the server. Treat 404s as success.
      for (const remove of toRemove) {
        try {
          await ApiClient.removeFromCart(Number(remove.productId), token);
        } catch (err) {
          if (err instanceof Error && /Item not in your cart|not in your cart/i.test(err.message)) {
            console.debug('[CartContext] removeItems: item already absent on server, ignoring', remove.productId);
            continue;
          }
          throw err;
        }
      }

      // After server confirms removals, update local state
      setCartItems(current =>
        current.filter(item => {
          const shouldRemove = toRemove.some(r => {
            if (item.perfume_id !== r.productId) return false;
            if (r.selectedSize) return item.size === r.selectedSize;
            return true;
          });
          return !shouldRemove;
        })
      );
    } catch (error) {
      console.error('Error removing items from cart:', error);
      // Refresh from server on error to maintain consistency
      await fetchCartItems();
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      // Remove items on the server first, ignoring 404s
      for (const item of cartItems) {
        try {
          await ApiClient.removeFromCart(Number(item.perfume_id), token);
        } catch (err) {
          if (err instanceof Error && /Item not in your cart|not in your cart/i.test(err.message)) {
            console.debug('[CartContext] clearCart: item already absent on server, ignoring', item.perfume_id);
            continue;
          }
          throw err;
        }
      }

      // Clear local state after server confirms
      setCartItems([]);
      
      // Clear checkout backup
      await clearCheckoutBackup();
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Initial cart fetch and auth status changes
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('Fetching initial cart items...');
      fetchCartItems();
    } else {
      console.log('Not authenticated, clearing cart items');
      setCartItems([]);
    }
  }, [isAuthenticated, token]);

  // Keep cart in sync
  useEffect(() => {
    let timeoutId;
    
    const syncCart = async () => {
      if (isAuthenticated && token) {
        await fetchCartItems();
      }
    };

    if (isAuthenticated && token) {
      // Sync cart every 30 seconds
      timeoutId = setInterval(syncCart, 30000);
    }

    return () => {
      if (timeoutId) {
        clearInterval(timeoutId);
      }
    };
  }, [isAuthenticated, token, fetchCartItems]);

  // Debug effect to log cart state changes
  useEffect(() => {
    console.log('Cart items updated:', cartItems);
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{ 
        items: cartItems,
        isLoading,
        addItem,
        removeItem,
        removeItems,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        refreshCart: fetchCartItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

CartProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}