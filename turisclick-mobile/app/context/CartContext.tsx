import React, { createContext, useContext, useState } from 'react';

// Definir tipos para el carrito
export interface CartItem {
  id: number;
  sectorId: number;
  attractionId: number;
  sectorName: string;
  attractionName: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeFromCart: (sectorId: number) => void;
  updateQuantity: (sectorId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

// Crear el contexto con valores por defecto
export const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

// Hook personalizado para usar el contexto
export const useCart = () => useContext(CartContext);

// Proveedor del contexto
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Añadir un item al carrito o incrementar su cantidad si ya existe
  const addToCart = (newItem: Omit<CartItem, 'id' | 'quantity'>) => {
    setItems((currentItems) => {
      // Verificar si el item ya está en el carrito
      const existingItemIndex = currentItems.findIndex(
        (item) => item.sectorId === newItem.sectorId
      );

      if (existingItemIndex >= 0) {
        // Incrementar la cantidad si ya existe
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        // Añadir nuevo item con ID único y cantidad 1
        const newId = Date.now();
        return [...currentItems, { ...newItem, id: newId, quantity: 1 }];
      }
    });
  };

  // Eliminar un item del carrito
  const removeFromCart = (sectorId: number) => {
    setItems((currentItems) => 
      currentItems.filter((item) => item.sectorId !== sectorId)
    );
  };

  // Actualizar la cantidad de un item
  const updateQuantity = (sectorId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(sectorId);
      return;
    }

    setItems((currentItems) => 
      currentItems.map((item) => 
        item.sectorId === sectorId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Vaciar el carrito
  const clearCart = () => {
    setItems([]);
  };

  // Calcular el total de items en el carrito
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calcular el precio total
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity, 
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}; 