import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  paymentMethod: 'paypal' | 'ltc' | 'paysafecard';
  pricePayPal: number;
  priceLTC: number;
  pricePSC: number;
  pscFeePercent: number;
  buyerEmail?: string;
  paysafecardPin?: string;
  productName: string;
  productImage: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => { paypal: number; ltc: number; psc: number };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_cart');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load cart:', e);
        }
      }
    }
  }, []);

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_cart', JSON.stringify(items));
    }
  }, [items]);

  const addToCart = (item: CartItem) => {
    setItems((prevItems) => {
      // Vérifier si l'article existe déjà avec les mêmes paramètres
      const existingIndex = prevItems.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.paymentMethod === item.paymentMethod &&
          i.buyerEmail === item.buyerEmail &&
          i.paysafecardPin === item.paysafecardPin
      );

      if (existingIndex >= 0) {
        // Augmenter la quantité
        const updated = [...prevItems];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }

      // Ajouter un nouvel article
      return [...prevItems, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    const totals = { paypal: 0, ltc: 0, psc: 0 };

    items.forEach((item) => {
      const pscPrice = item.pricePSC * (1 + item.pscFeePercent / 100);

      totals.paypal += item.pricePayPal * item.quantity;
      totals.ltc += item.priceLTC * item.quantity;
      totals.psc += pscPrice * item.quantity;
    });

    return totals;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
