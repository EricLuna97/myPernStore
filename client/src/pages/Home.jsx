import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/productService';
import '../App.css'; 

function Home() {
  const [productos, setProductos] = useState([]);
  
  const [busqueda, setBusqueda] = useState("");

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
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await deleteProduct(id);
        cargarProductos();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const productosFiltrados = productos.filter((producto) => 
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="app-container">
      <h1>Mi Tienda PERN 🛍️</h1>
      
      <div className="acciones-container">
        
        <input 
          type="text" 
          placeholder="🔍 Buscar producto..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="buscador-input"
        />

        <Link to="/cargar">
            <button className="btn-agregar">
                ➕ Nuevo Producto
            </button>
        </Link>
      </div>

      <div className="productos-grid">
        {productosFiltrados.map((producto) => (
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
            
            <button 
              className="btn-eliminar" 
              onClick={() => handleEliminar(producto.id)}
            >
              🗑️ Eliminar
            </button>
          </div>
        ))}
        {productosFiltrados.length === 0 && (
          <p style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
            No se encontraron productos con ese nombre 
          </p>
        )}
      </div>
    </div>
  );
}

export default Home;