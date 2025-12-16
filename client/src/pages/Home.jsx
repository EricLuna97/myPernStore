import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/productService';
import '../App.css'; 
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();  

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

    {/* --- HERO SECTION (ADMINISTRACIÓN) --- */ }
<div style={{
  backgroundColor: 'var(--bg-card)',
  padding: '30px',
  borderRadius: '16px',
  marginBottom: '40px',
  borderLeft: '5px solid var(--accent-color)', /* Borde lateral tipo Dashboard */
  textAlign: 'left', /* Alineado a la izquierda, más serio */
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
  <div>
    <h2 style={{ fontSize: '2rem', margin: '0 0 5px 0', color: 'var(--accent-color)' }}>
      PANEL DE INVENTARIO 📦
    </h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
      Administra tus productos y categorías desde aquí.
    </p>
  </div>
</div>
      
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
            
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: 'auto' }}>
              <button 
                style={{ flex: 1, background: '#f1c40f', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => navigate('/cargar', { state: { productoEditar: producto } })}
              >
                 Editar
              </button>
              <button 
                className="btn-eliminar" 
                style={{ flex: 1 }}
                onClick={() => handleEliminar(producto.id)}
              >
                 Eliminar
              </button>
            </div>
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