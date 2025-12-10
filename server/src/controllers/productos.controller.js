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

const createProducto = async (req, res) => {
  const { nombre, precio, stock, categoria_id } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, precio, stock, categoria_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

module.exports = {
  getAllProductos,
  createProducto 
};
