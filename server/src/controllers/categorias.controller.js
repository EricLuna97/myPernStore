const pool = require('../config/db');

// 1. Obtener catálogo de categorías
const getAllCategorias = async (_req, res) => { // Usamos _req para indicar que el parámetro no se usa
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error("Error en getAllCategorias:", error.message);
    res.status(500).json({ error: "Error interno al obtener categorías" });
  }
};

// 2. Crear categoría (Con control lógico)
const createCategoria = async (req, res) => {
  const { nombre } = req.body;

  // Validación 1: Evitar que manden un dato vacío
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categorias (nombre) VALUES ($1) RETURNING *',
      [nombre.trim()] // Limpiamos espacios accidentales al inicio o final
    );
    
    // Devolvemos 201 (Created) en lugar de 200 (OK) por estándar REST
    res.status(201).json(result.rows[0]); 
  } catch (error) {
    console.error("Error en createCategoria:", error.message);
    
    // Validación 2: Control del código de error de PostgreSQL para datos duplicados
    if (error.code === '23505') {
      return res.status(400).json({ error: "Ya existe una categoría con ese nombre" });
    }

    res.status(500).json({ error: "Error interno al crear categoría" });
  }
};

module.exports = {
  getAllCategorias,
  createCategoria
};