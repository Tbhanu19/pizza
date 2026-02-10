import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

function mapBackendItem(backendItem) {
  const name = backendItem.menu_item?.name ?? backendItem.custom_data?.name ?? 'Custom Pizza';
  const price = backendItem.menu_item?.price ?? backendItem.unit_price ?? backendItem.custom_data?.price ?? 0;
  const customData = backendItem.custom_data || {};
  const { image: _storedImage, ...customizations } = customData;
  return {
    id: backendItem.id,
    menu_item_id: backendItem.product_id ?? backendItem.menu_item?.id,
    name,
    price: Number(price),
    quantity: backendItem.quantity,
    customizations,
    image: backendItem.menu_item?.image ?? _storedImage ?? '🍕',
  };
}

export const CartProvider = ({ children }) => {
  const { isAuthenticated, openSignIn, authChecked } = useAuth();
  const [cart, setCart] = useState([]);
  const useBackend = api.isConfigured();
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!api.isConfigured()) return;
    setCartLoading(true);
    try {
      const data = await api.getCart();
      const items = (data.items || []).map(mapBackendItem);
      setCart(items);
    } catch (_) {
      setCart([]);
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!api.isConfigured()) {
      const savedCart = localStorage.getItem('pizzaCart');
      if (savedCart) setCart(JSON.parse(savedCart));
      else setCart([]);
      return;
    }
    if (!authChecked) return;
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [authChecked, isAuthenticated, fetchCart]);

  useEffect(() => {
    if (!useBackend || !api.isConfigured()) {
      localStorage.setItem('pizzaCart', JSON.stringify(cart));
    }
  }, [cart, useBackend]);

  const addToCart = async (item) => {
    if (useBackend && api.isConfigured()) {
      if (!isAuthenticated) {
        openSignIn();
        return;
      }
      try {
        const productId = item.menu_item_id ?? item.product_id;
        const customData = { ...(item.customizations || {}), image: item.image };
        const body = productId != null
          ? { product_id: productId, quantity: item.quantity ?? 1, custom_data: customData }
          : { quantity: item.quantity ?? 1, custom_data: { name: item.name, price: item.price, ...customData } };
        await api.addCartItem(body);
        await fetchCart();
      } catch (e) {
        throw e;
      }
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.id === item.id && JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
      );
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === existingItem.id && JSON.stringify(cartItem.customizations) === JSON.stringify(existingItem.customizations)
            ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: item.quantity ?? 1 }];
    });
  };

  const removeFromCart = async (itemId, customizations) => {
    if (useBackend && api.isConfigured()) {
      try {
        await api.removeCartItem(itemId);
        await fetchCart();
      } catch (e) {
        throw e;
      }
      return;
    }
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item.id === itemId && JSON.stringify(item.customizations) === JSON.stringify(customizations))
      )
    );
  };

  const updateQuantity = async (itemId, customizations, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId, customizations);
      return;
    }
    if (useBackend && api.isConfigured()) {
      try {
        await api.updateCartItem(itemId, { quantity });
        await fetchCart();
      } catch (e) {
        throw e;
      }
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId && JSON.stringify(item.customizations) === JSON.stringify(customizations)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = async () => {
    if (useBackend && api.isConfigured()) {
      try {
        await api.clearCart();
        await fetchCart();
      } catch (_) {
        setCart([]);
      }
      return;
    }
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    cartLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    useBackend: useBackend && api.isConfigured(),
    refetchCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
