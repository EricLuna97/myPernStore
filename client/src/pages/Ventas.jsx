import { useEffect, useState } from 'react';
import '../App.css';

function Ventas() {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    try {
      const res = await fetch('http://localhost:3000/ventas');
      const data = await res.json();
      setVentas(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Formato de fecha legible
  const formatDate = (fechaString) => {
    return new Date(fechaString).toLocaleString('es-ES', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
  };

  return (
    <div className="app-container">
      <div className="form-wrapper" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <h1 style={{ borderBottom: '1px solid #00f3ff', paddingBottom: '10px' }}>
          Registro de Ventas 💰
        </h1>
        
        {ventas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
            Aún no hay ventas registradas.
          </p>
        ) : (
          <div className="tabla-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th>Fecha</th>
                  <th>Productos Vendidos</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '15px 10px', color: '#00f3ff' }}>#{venta.id}</td>
                    <td style={{ color: '#aaa' }}>{formatDate(venta.fecha)}</td>
                    <td style={{ color: '#fff' }}>{venta.resumen}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        ${parseFloat(venta.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Ventas;