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

// 3. Crear producto (con Código de Barras y Estandarización financiera)
const createProducto = async (req, res) => {
  const { nombre, codigo_barras, descripcion, precio_costo, precio_venta, stock, categoria_id, imagen } = req.body;
  
  let imagen_url = null;
  if (imagen) {
    imagen_url = imagen; 
  } else if (req.file) {
    imagen_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const cleanCodigo = codigo_barras && codigo_barras.trim() !== '' ? codigo_barras.trim() : null;

  try {
    const result = await pool.query(
      `INSERT INTO productos 
      (nombre, codigo_barras, descripcion, precio_costo, precio_venta, stock, categoria_id, imagen_url) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nombre, cleanCodigo, descripcion, precio_costo, precio_venta, stock, categoria_id, imagen_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en createProducto:", error.message);
    if (error.code === '23505') {
      return res.status(400).json({ error: `El código de barras "${cleanCodigo}" ya está asignado a otro producto.` });
    }
    res.status(500).json({ error: "Error interno al registrar el producto" });
  }
};

// 4. Borrado Lógico
const deleteProducto = async (req, res) => {
  const { id } = req.params;

  try {
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
  const { nombre, codigo_barras, descripcion, precio_costo, precio_venta, stock, categoria_id, imagen } = req.body;
  
  let imagen_url = null;
  if (imagen) {
    imagen_url = imagen;
  } else if (req.file) {
    imagen_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const cleanCodigo = codigo_barras && codigo_barras.trim() !== '' ? codigo_barras.trim() : null;

  try {
    let result;
    
    const checkActive = await pool.query('SELECT activo FROM productos WHERE id = $1', [id]);
    if (checkActive.rowCount === 0 || !checkActive.rows[0].activo) {
      return res.status(404).json({ message: "No se puede editar un producto inactivo o inexistente" });
    }

    if (imagen_url) {
      result = await pool.query(
        `UPDATE productos 
        SET nombre=$1, codigo_barras=$2, descripcion=$3, precio_costo=$4, precio_venta=$5, stock=$6, categoria_id=$7, imagen_url=$8 
        WHERE id=$9 RETURNING *`,
        [nombre, cleanCodigo, descripcion, precio_costo, precio_venta, stock, categoria_id, imagen_url, id]
      );
    } else {
      result = await pool.query(
        `UPDATE productos 
        SET nombre=$1, codigo_barras=$2, descripcion=$3, precio_costo=$4, precio_venta=$5, stock=$6, categoria_id=$7 
        WHERE id=$8 RETURNING *`,
        [nombre, cleanCodigo, descripcion, precio_costo, precio_venta, stock, categoria_id, id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en updateProducto:", error.message);
    if (error.code === '23505') {
      return res.status(400).json({ error: `El código de barras "${cleanCodigo}" ya está asignado a otro producto.` });
    }
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
