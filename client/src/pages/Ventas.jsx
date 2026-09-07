import { useEffect, useState } from 'react';

function Ventas() {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    // 1. La función nace estrictamente dentro del efecto
    const cargarVentas = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/ventas');
        const data = await res.json();
        setVentas(data);
      } catch (error) {
        console.error("Error al cargar ventas:", error);
      }
    };

    // 2. Se ejecuta inmediatamente
    cargarVentas();
  }, []);

  // Formato de fecha estandarizado a hora local
  const formatDate = (fechaString) => {
    const isUTC = fechaString.endsWith('Z') ? fechaString : `${fechaString}Z`;
    return new Date(isUTC).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="app-container">
      <div className="form-wrapper" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <h1 style={{ borderBottom: '1px solid #00f3ff', paddingBottom: '10px' }}>
          Registro de Ventas 
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