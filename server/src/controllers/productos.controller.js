const pool = require('../config/db');

// OBTENER TODOS
const getAllProductos = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos');
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

const getProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al obtener producto" });
  }
};

// CREAR
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

// ELIMINAR
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

// ACTUALIZAR
const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock, categoria_id } = req.body;
  const imagen_url = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : null;

  try {
    let result;
    
    if (imagen_url) {
      // Actualizamos TODO (incluida imagen)
      result = await pool.query(
        'UPDATE productos SET nombre=$1, precio=$2, stock=$3, categoria_id=$4, imagen_url=$5 WHERE id=$6 RETURNING *',
        [nombre, precio, stock, categoria_id, imagen_url, id]
      );
    } else {
      // Actualizamos todo MENOS imagen
      result = await pool.query(
        'UPDATE productos SET nombre=$1, precio=$2, stock=$3, categoria_id=$4 WHERE id=$5 RETURNING *',
        [nombre, precio, stock, categoria_id, id]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

module.exports = {
  getAllProductos,
  getProducto, 
  createProducto,
  deleteProducto,
  updateProducto
};