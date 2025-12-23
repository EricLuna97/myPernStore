const { Router } = require('express');
const pool = require('../config/db'); 
const router = Router();

router.get('/ventas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ventas', async (req, res) => {
  const { total, items } = req.body; 

  try {
    for (const item of items) {
      await pool.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    const resumen = items.map(i => `${i.quantity}x ${i.nombre}`).join(', ');

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