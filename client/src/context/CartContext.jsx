import { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Inicializamos el carrito leyendo del LocalStorage (para no perder datos si recarga)
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('shopping-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Cada vez que el carrito cambie, lo guardamos en LocalStorage
  useEffect(() => {
    localStorage.setItem('shopping-cart', JSON.stringify(cart));
  }, [cart]);

  // FUNCION 1: Agregar producto
 const addToCart = (product) => {
    
    // 1. Primero miramos si ya existe (usando el estado actual 'cart')
    const existingItem = cart.find((item) => item.id === product.id);

    // 2. Disparamos el mensaje UNA SOLA VEZ antes de actualizar
    if (existingItem) {
      toast.success(`Se agregó otra unidad: ${product.nombre}`);
    } else {
      toast.success(`${product.nombre} agregado al pedido 🛒`);
    }

    // 3. Ahora sí, actualizamos el estado (esto es lógica pura de datos)
    setCart((prevCart) => {
      const isInCart = prevCart.find((item) => item.id === product.id);

      if (isInCart) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };
  // FUNCION 2: Eliminar producto
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    toast.error("Producto eliminado del pedido");
  };

  // FUNCION 3: Limpiar todo (después de vender)
  const clearCart = () => {
    setCart([]);
  };

  // Calcular total de items (para el numerito rojo del navbar)
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};