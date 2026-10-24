/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';

// Creamos el contexto
export const CartContext = createContext();

// Clave única con la que guardaremos en la memoria del navegador
const STORAGE_KEY = 'pern_store_cart';

// Creamos el Provider
export const CartProvider = ({ children }) => {
  // 1. Lazy Initialization: Leemos de localStorage una sola vez al cargar la app
  const [cart, setCart] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      return guardado ? JSON.parse(guardado) : [];
    } catch (error) {
      console.error("Error al leer el carrito de localStorage:", error);
      return [];
    }
  });

  // 2. Efecto reactivo: Cada vez que 'cart' cambie, lo guardamos automáticamente
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Error al guardar el carrito en localStorage:", error);
    }
  }, [cart]);

  // Suma total de unidades en el carrito (para el badge del Navbar)
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

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
      totalItems,
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
