/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';

// Creamos el contexto
export const CartContext = createContext();

// Creamos el Provider
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (producto) => {
    setCart((carritoActual) => {
      const existe = carritoActual.find((item) => item.id === producto.id);
      if (existe) {
        return carritoActual.map((item) =>
          item.id === producto.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...carritoActual, { ...producto, quantity: 1 }];
    });
  };

  const removeFromCart = (idProducto) => {
    setCart((carritoActual) => carritoActual.filter((item) => item.id !== idProducto));
  };

  const decreaseQuantity = (idProducto) => {
    setCart((carritoActual) => {
      return carritoActual
        .map((item) => {
          if (item.id === idProducto) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      decreaseQuantity, 
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Exportamos el hook para que la vista pueda usarlo
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
};