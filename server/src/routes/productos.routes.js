const { Router } = require('express');
const { 
  getAllProductos, 
  getProducto, 
  createProducto, 
  deleteProducto, 
  updateProducto,
  cargaMasivaProductos
} = require('../controllers/productos.controller');
const upload = require('../config/multer');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

const router = Router();

// Consultas de catálogo (Disponibles para el lector de código de barras y POS)
router.get('/', getAllProductos);
router.get('/:id', getProducto);

// Operaciones críticas de inventario protegidas por Roles
router.post('/carga-masiva', verifyToken, requireRole(['admin', 'supervisor']), cargaMasivaProductos);
router.post('/', verifyToken, upload.single('imagen'), createProducto);
router.put('/:id', verifyToken, upload.single('imagen'), updateProducto);
router.delete('/:id', verifyToken, requireRole(['admin', 'supervisor']), deleteProducto);

module.exports = router;
