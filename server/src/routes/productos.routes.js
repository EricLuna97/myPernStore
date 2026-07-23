const { Router } = require('express');
const { 
  getAllProductos, getProducto, createProducto, deleteProducto, updateProducto 
} = require('../controllers/productos.controller');
const upload = require('../config/multer');
const verifyToken = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', getAllProductos);
router.get('/:id', getProducto);
router.post('/', verifyToken, upload.single('imagen'), createProducto);
router.put('/:id', verifyToken, upload.single('imagen'), updateProducto);
router.delete('/:id', verifyToken, deleteProducto);

module.exports = router;