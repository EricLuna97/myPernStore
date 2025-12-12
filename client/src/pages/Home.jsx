import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 
import { getProducts, deleteProduct } from '../services/productService'; 

function Home() {
  const [productos, setProductos] = useState([]);

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

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        await deleteProduct(id);
        cargarProductos();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  return (
    <div className="app-container">
      <h1>Mi Tienda PERN 🛍️</h1>
      
      {/* Botón para navegar a la página de carga */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/cargar">
            <button style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
                ➕ Agregar Nuevo Producto
            </button>
        </Link>
      </div>

      <div className="productos-grid">
        {productos.map((producto) => (
          <div key={producto.id} className="card">
             {/* Lógica de imagen segura */}
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
            
            <button 
              className="btn-eliminar" 
              onClick={() => handleEliminar(producto.id)}
            >
              🗑️ Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;