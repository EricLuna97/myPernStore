const pool = require('../config/db');

const getAllProductos = async (req, res) => {
  try {
    // Pedimos todos los productos a la BD
    const result = await pool.query('SELECT * FROM productos');
    
    // Enviamos solo las filas (rows) en formato JSON
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

module.exports = {
  getAllProductos
};