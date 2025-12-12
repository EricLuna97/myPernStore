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

const createProducto = async (req, res) => {
  const { nombre, precio, stock, categoria_id } = req.body;
  const imagenFilename = req.file ? req.file.filename : null;
  const imagen_url = imagenFilename ? 'http://localhost:3000/uploads/' + imagenFilename : null;

  try {
    const result = await pool.query(
      'INSERT INTO productos (nombre, precio, stock, categoria_id, imagen_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, precio, stock, categoria_id, imagen_url]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

const deleteProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};

module.exports = {
  getAllProductos,
  createProducto,
  deleteProducto
};
