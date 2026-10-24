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

// 2. Procesar una venta compleja (Transacción atómica protegida contra concurrencia)
const createVenta = async (req, res) => {
  const { total, items, usuario_id } = req.body; 

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "El pedido no contiene productos." });
  }
  
  // Reservamos un cliente dedicado del pool para esta transacción exclusiva
  const client = await pool.connect();

  try {
    // INICIA LA TRANSACCIÓN
    await client.query('BEGIN'); 

    // Paso A: Insertar la cabecera en la tabla 'ventas' y obtener su ID
    const ventaResult = await client.query(
      'INSERT INTO ventas (usuario_id, total) VALUES ($1, $2) RETURNING id',
      [usuario_id || null, total]
    );
    const ventaId = ventaResult.rows[0].id;

    // Paso B: Recorrer el carrito de compras (items) y descontar stock atómicamente
    for (const item of items) {
      const subtotal = item.quantity * item.precio_venta;

      // 1. Descontar el stock físico protegiendo contra condiciones de carrera:
      // Solo descuenta SI Y SOLO SI hay suficiente stock disponible (stock >= item.quantity)
      const stockUpdateResult = await client.query(
        `UPDATE productos 
         SET stock = stock - $1 
         WHERE id = $2 AND stock >= $1 
         RETURNING stock, nombre`,
        [item.quantity, item.id]
      );

      // Si rowCount === 0, significa que no cumplió 'stock >= quantity' (stock insuficiente o producto inactivo)
      if (stockUpdateResult.rowCount === 0) {
        // Consultamos el stock actual real para informarle al cajero con exactitud
        const checkStock = await client.query('SELECT nombre, stock FROM productos WHERE id = $1', [item.id]);
        const prod = checkStock.rows[0];
        const stockActual = prod ? prod.stock : 0;
        const nombreProd = prod ? prod.nombre : item.nombre || `ID #${item.id}`;

        throw new Error(`Stock insuficiente para "${nombreProd}". Solicitaste: ${item.quantity}, disponibles en stock: ${stockActual}.`);
      }

      // 2. Insertar la línea en 'detalle_ventas' (Congelando el precio histórico)
      await client.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_historico, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [ventaId, item.id, item.quantity, item.precio_venta, subtotal]
      );
    }

    // FINALIZA LA TRANSACCIÓN: Todo fue consistente, guardamos los cambios de forma permanente
    await client.query('COMMIT'); 
    
    res.status(201).json({ 
      message: 'Venta registrada, detalles guardados y stock actualizado con éxito',
      venta_id: ventaId 
    });

  } catch (error) {
    // CONTROL DE DAÑOS: Revertimos absolutamente todo si falló algún ítem
    await client.query('ROLLBACK'); 
    console.error("Transacción revertida en createVenta:", error.message);
    res.status(400).json({ error: error.message || 'Error crítico al procesar la venta.' });
  } finally {
    // Siempre liberamos la conexión al pool
    client.release(); 
  }
};

module.exports = {
  getAllVentas,
  createVenta
};
