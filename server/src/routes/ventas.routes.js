const { Router } = require('express');
const pool = require('../config/db'); 
const router = Router();

// 1. OBTENER HISTORIAL DE VENTAS
router.get('/ventas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. CREAR VENTA Y DESCONTAR STOCK (LÓGICA CRÍTICA)
router.post('/ventas', async (req, res) => {
  console.log("🔥 INTENTO DE VENTA RECIBIDO");
  console.log("Cuerpo (req.body):", req.body);
  const { total, items } = req.body;
  console.log("Items a procesar:", items); 

  try {
    // A. Descontar Stock: Recorremos cada producto del carrito
    for (const item of items) {
      await pool.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    // B. Crear resumen de texto (Ej: "2x Monitor, 1x Mouse")
    const resumen = items.map(i => `${i.quantity}x ${i.nombre}`).join(', ');

    // C. Guardar el registro en la tabla ventas
    await pool.query(
      'INSERT INTO ventas (total, resumen) VALUES ($1, $2)',
      [total, resumen]
    );

    res.json({ message: 'Venta registrada y stock actualizado' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la venta' });
  }
});

module.exports = router;