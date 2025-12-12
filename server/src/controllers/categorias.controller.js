const pool = require('../config/db');

// Obtener todas las categorías (para listarlas después)
const getAllCategorias = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

// Crear nueva categoría
const createCategoria = async (req, res) => {
  const { nombre } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO categorias (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

module.exports = {
  getAllCategorias,
  createCategoria
};