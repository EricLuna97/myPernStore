import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../App.css'; 

function Carrito() {
  const { cart, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const totalGeneral = cart.reduce((acc, item) => acc + (parseFloat(item.precio) * item.quantity), 0);

 const handleFinalizarVenta = async () => {
    if (!window.confirm("¿Confirmar venta y procesar stock? 💰")) {
      return; 
    }

    try {
      const token = localStorage.getItem('token');
      
      // 2. EL FETCH 
      const response = await fetch('http://localhost:3000/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          total: totalGeneral,
          items: cart 
        })
      });

      // 3. Si el servidor responde OK...
      if (response.ok) {
        toast.success("¡Venta registrada y Stock actualizado! 📉");
        clearCart(); 
        navigate('/'); 
      } else {
        // Si hubo error (ej: stock insuficiente)
        const data = await response.json();
        toast.error("Error: " + (data.error || "No se pudo procesar"));
      }

    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>El pedido está vacío 🕸️</h2>
        <p>Agrega productos desde el catálogo para comenzar una venta.</p>
        <Link to="/">
          <button className="btn-agregar">🔙 Volver al Catálogo</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="form-wrapper" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>
          Resumen de Pedido 📝
        </h1>

        {/* --- TABLA DE PRODUCTOS --- */}
        <div style={{ margin: '20px 0' }}>
          {cart.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#1a1a1a',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '8px',
              borderLeft: '4px solid var(--accent-color)'
            }}>
              
              {/* Info Producto */}
              <div style={{ flex: 2 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.nombre}</h3>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>
                  ${item.precio} x {item.quantity} u.
                </span>
              </div>

              {/* Subtotal Item */}
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>
                ${(item.precio * item.quantity).toLocaleString()}
              </div>

              {/* Botón Borrar */}
              <button 
                onClick={() => removeFromCart(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff0055',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  marginLeft: '20px'
                }}
                title="Quitar del pedido"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* --- TOTALES Y ACCIONES --- */}
        <div style={{ 
          marginTop: '30px', 
          paddingTop: '20px', 
          borderTop: '2px dashed #444',
          textAlign: 'right' 
        }}>
          <h2 style={{ fontSize: '2rem', color: '#00f3ff' }}>
            Total: ${totalGeneral.toLocaleString()}
          </h2>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
                onClick={clearCart}
                className="btn-eliminar"
                style={{ padding: '10px 20px' }}
            >
                Cancelar Venta
            </button>
            
            <button 
                onClick={handleFinalizarVenta}
                className="submit-btn" 
                style={{ width: 'auto', padding: '10px 40px', fontSize: '1.2rem' }}
            >
                ✅ Finalizar Venta
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Carrito;