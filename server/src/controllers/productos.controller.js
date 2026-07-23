const pool = require('../config/db');

// 1. Obtener catálogo (Filtro lógico: solo productos activos)
const getAllProductos = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos WHERE activo = true ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error("Error en getAllProductos:", error.message);
    res.status(500).json({ error: "Error interno al obtener el catálogo" });
  }
};

// 2. Obtener un producto específico
const getProducto = async (req, res) => {
  const { id } = req.params;
  try {
    // Nos aseguramos de que no puedan buscar un producto "borrado" directamente por ID
    const result = await pool.query('SELECT * FROM productos WHERE id = $1 AND activo = true', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado o inactivo" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en getProducto:", error.message);
    res.status(500).json({ error: "Error interno al obtener el producto" });
  }
};

// 3. Crear producto (Estandarización financiera)
const createProducto = async (req, res) => {
  // Extraemos los nuevos campos del MER
  const { nombre, descripcion, precio_costo, precio_venta, stock, categoria_id } = req.body;
  
  const imagenFilename = req.file ? req.file.filename : null;
  const imagen_url = imagenFilename ? `${req.protocol}://${req.get('host')}/uploads/${imagenFilename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO productos 
      (nombre, descripcion, precio_costo, precio_venta, stock, categoria_id, imagen_url) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre, descripcion, precio_costo, precio_venta, stock, categoria_id, imagen_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en createProducto:", error.message);
    res.status(500).json({ error: "Error interno al registrar el producto" });
  }
};

// 4. Borrado Lógico (Auditoría y control de datos)
const deleteProducto = async (req, res) => {
  const { id } = req.params;

  try {
    // NUNCA usamos DELETE FROM en una tabla transaccional. "Apagamos" el registro.
    const result = await pool.query(
      'UPDATE productos SET activo = false WHERE id = $1 RETURNING *', 
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    
    res.json({ message: "Producto dado de baja correctamente (Soft Delete)" });
  } catch (error) {
    console.error("Error en deleteProducto:", error.message);
    res.status(500).json({ error: "Error interno al dar de baja el producto" });
  }
};

// 5. Actualizar producto
const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_costo, precio_venta, stock, categoria_id } = req.body;
  const imagen_url = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

  try {
    let result;
    
    // Verificamos que el producto exista y esté activo antes de actualizarlo
    const checkActive = await pool.query('SELECT activo FROM productos WHERE id = $1', [id]);
    if (checkActive.rowCount === 0 || !checkActive.rows[0].activo) {
      return res.status(404).json({ message: "No se puede editar un producto inactivo o inexistente" });
    }

    if (imagen_url) {
      result = await pool.query(
        `UPDATE productos 
        SET nombre=$1, descripcion=$2, precio_costo=$3, precio_venta=$4, stock=$5, categoria_id=$6, imagen_url=$7 
        WHERE id=$8 RETURNING *`,
        [nombre, descripcion, precio_costo, precio_venta, stock, categoria_id, imagen_url, id]
      );
    } else {
      result = await pool.query(
        `UPDATE productos 
        SET nombre=$1, descripcion=$2, precio_costo=$3, precio_venta=$4, stock=$5, categoria_id=$6 
        WHERE id=$7 RETURNING *`,
        [nombre, descripcion, precio_costo, precio_venta, stock, categoria_id, id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en updateProducto:", error.message);
    res.status(500).json({ error: "Error interno al actualizar el producto" });
  }
};

module.exports = {
  getAllProductos,
  getProducto, 
  createProducto,
  deleteProducto,
  updateProducto
};