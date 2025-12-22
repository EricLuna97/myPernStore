import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/productService';
import '../App.css'; 
import toast from 'react-hot-toast';

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
        toast.success("Producto eliminado del sistema 🗑️");
        cargarProductos();
      } catch (error) {
        toast.error("No se pudo eliminar el producto");
      }
    }
  };

  const productosFiltrados = productos.filter((producto) => 
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- 📊 CÁLCULO DE MÉTRICAS (NUEVO) ---
  const totalProductos = productos.length;
  const valorInventario = productos.reduce((total, prod) => {
    return total + (parseFloat(prod.precio) * parseInt(prod.stock));
  }, 0);

  return (
    <div className="app-container">

      {/* --- DASHBOARD HEADER --- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '30px',
        borderRadius: '16px',
        marginBottom: '40px',
        borderLeft: '5px solid var(--accent-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', margin: '0 0 5px 0', color: 'var(--accent-color)' }}>
            PANEL DE VENTAS 📈
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
            Sistema de gestión interna
          </p>
        </div>

        {/* --- TARJETAS DE MÉTRICAS --- */}
        <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center', background: '#1a1a1a', padding: '10px 20px', borderRadius: '8px', border: '1px solid #333' }}>
                <span style={{ display:'block', color: '#888', fontSize: '0.9rem' }}>Items en Catálogo</span>
                <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>{totalProductos}</span>
            </div>
            <div style={{ textAlign: 'center', background: '#1a1a1a', padding: '10px 20px', borderRadius: '8px', border: '1px solid #333' }}>
                <span style={{ display:'block', color: '#888', fontSize: '0.9rem' }}>Valor del Stock</span>
                <span style={{ color: '#00f3ff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    ${valorInventario.toLocaleString()}
                </span>
            </div>
        </div>
      </div>
      
      {/* --- BUSCADOR Y BOTÓN --- */}
      <div className="acciones-container">
        <input 
          type="text" 
          placeholder="🔍 Buscar en inventario..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="buscador-input"
        />

        <Link to="/cargar">
            <button className="btn-agregar">
                ➕ Ingresar Stock
            </button>
        </Link>
      </div>

      {/* --- GRID DE PRODUCTOS --- */}
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
            
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', color:'#aaa', fontSize:'0.9rem'}}>
                <span>Stock: <strong style={{color:'white'}}>{producto.stock}</strong></span>
            </div>

            <p className="precio">${producto.precio}</p>
            
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: 'auto' }}>
              <button 
                style={{ flex: 1, background: '#f1c40f', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => navigate(`/editar/${producto.id}`)}
              >
                  Editar
              </button>
              <button 
                className="btn-eliminar" 
                style={{ flex: 1 }}
                onClick={() => handleEliminar(producto.id)}
              >
                  Baja
              </button>
            </div>
          </div>
        ))}

        {productosFiltrados.length === 0 && (
          <p style={{ gridColumn: '1 / -1', marginTop: '20px', textAlign:'center', color:'#666' }}>
            No hay productos que coincidan con la búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}

export default Home;