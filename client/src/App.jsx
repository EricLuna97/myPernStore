import { useEffect, useState } from 'react';
import { getProducts } from './services/productService'; // Importamos el servicio
import './App.css';

function App() {
  const [productos, setProductos] = useState([]); // Aquí guardaremos los datos

  // Este "efecto" se ejecuta automáticamente cuando carga la página
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProducts();
        setProductos(data); // Guardamos los datos en el estado
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="app-container">
      <h1>Mi Tienda PERN 🛍️</h1>
      
      <div className="productos-grid">
        {productos.map((producto) => (
          <div key={producto.id} className="card">
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