const pool = require('../config/db');

// 1. Obtener historial de ventas (Cabeceras + Detalles)
const getAllVentas = async (_req, res) => {
  try {
    const query = `
      SELECT 
        v.id, 
        v.fecha, 
        v.total,
        u.nombre AS vendedor,
        json_agg(
          json_build_object(
            'producto_id', dv.producto_id,
            'nombre', p.nombre,
            'cantidad', dv.cantidad,
            'precio_historico', dv.precio_historico,
            'subtotal', dv.subtotal
          )
        ) AS detalles
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
      LEFT JOIN productos p ON dv.producto_id = p.id
      GROUP BY v.id, v.fecha, v.total, u.nombre
      ORDER BY v.fecha DESC;
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en getAllVentas:", error.message);
    res.status(500).json({ error: "Error al obtener el historial de ventas" });
  }
};

// 2. Procesar una venta compleja (Transacción)
const createVenta = async (req, res) => {
  const { total, items, usuario_id } = req.body; 
  
  // Reservamos un cliente dedicado del pool para esta transacción exclusiva
  const client = await pool.connect();

  try {
    // INICIA LA TRANSACCIÓN: Todo lo que pase a partir de aquí es un paquete único
    await client.query('BEGIN'); 

    // Paso A: Insertar la cabecera en la tabla 'ventas' y obtener su ID
    const ventaResult = await client.query(
      'INSERT INTO ventas (usuario_id, total) VALUES ($1, $2) RETURNING id',
      [usuario_id, total]
    );
    const ventaId = ventaResult.rows[0].id;

    // Paso B: Recorrer el carrito de compras (items)
    for (const item of items) {
      const subtotal = item.quantity * item.precio_venta;

      // 1. Insertar la línea en 'detalle_ventas' (Congelando el precio histórico)
      await client.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_historico, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [ventaId, item.id, item.quantity, item.precio_venta, subtotal]
      );

      // 2. Restar el stock físico de la tabla 'productos'
      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    // FINALIZA LA TRANSACCIÓN: Si el código llegó hasta aquí sin romperse, guardamos todo permanentemente
    await client.query('COMMIT'); 
    
    res.status(201).json({ 
      message: 'Venta registrada, detalles guardados y stock actualizado con éxito',
      venta_id: ventaId 
    });

  } catch (error) {
    // CONTROL DE DAÑOS: Si hubo CUALQUIER error en el Paso A o B, deshacemos todo.
    // Así evitamos cobrar dinero sin restar stock, o viceversa.
    await client.query('ROLLBACK'); 
    console.error("Error crítico en createVenta (Transacción revertida):", error.message);
    res.status(500).json({ error: 'Error crítico al procesar la venta. Se ha cancelado la operación.' });
  } finally {
    // Siempre devolvemos el cliente al pool para que el servidor no se sature
    client.release(); 
  }
};

module.exports = {
  getAllVentas,
  createVenta
};