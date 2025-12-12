import { useEffect, useState } from 'react';
import { getProducts } from './services/productService';
import Formulario from './components/Formulario'; 
import './App.css';

function App() {
  const [productos, setProductos] = useState([]);

  // Convertimos la carga de datos en una función reutilizable
  const cargarProductos = async () => {
    try {
      const data = await getProducts();
      setProductos(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  return (
    <div className="app-container">
      <h1>Mi Tienda PERN 🛍️</h1>
      
      {/* Agregamos el formulario y le pasamos la función para recargar la lista */}
      <Formulario alCrear={cargarProductos} />

      <div className="productos-grid">
        {productos.map((producto) => (
          <div key={producto.id} className="card">
            {producto.imagen_url && !producto.imagen_url.includes("null") && !producto.imagen_url.includes("undefined") ? (
            <img 
              src={producto.imagen_url} 
              alt={producto.nombre} 
              className="producto-imagen"
              onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none'; 
    }}
  />
  ) : (
  <div className="producto-imagen placeholder-local">
    <span>Sin Foto 📷</span>
  </div>
)}
            <h3>{producto.nombre}</h3>
            <p className="precio">${producto.precio}</p>
            <p>Stock: {producto.stock}</p>
            <small>Categoría: {producto.categoria_id}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;