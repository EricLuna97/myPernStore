import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

function Carrito() {
  const { cart, removeFromCart, decreaseQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const totalGeneral = cart.reduce((acc, item) => acc + (parseFloat(item.precio_venta) * item.quantity), 0);

  const handleFinalizarVenta = async () => {
    if (!window.confirm("¿Confirmar venta y procesar stock? ")) {
      return; 
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:4000/api/ventas', {
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

      if (response.ok) {
        toast.success("¡Venta registrada y Stock actualizado! ");
        clearCart(); 
        navigate('/'); 
      } else {
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
        <h2>El pedido está vacío </h2>
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
          Resumen de Pedido 
        </h1>

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
              
              <div style={{ flex: 2 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.nombre}</h3>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>
                  ${item.precio_venta} x {item.quantity} u.
                </span>
              </div>

              <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>
                ${(item.precio_venta * item.quantity).toLocaleString()}
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => decreaseQuantity(item.id)}
                >
                  -
                </Button>
                
                <span className="font-bold text-lg w-6 text-center text-white">
                  {item.quantity}
                </span>
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div> 
          ))}
        </div>

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