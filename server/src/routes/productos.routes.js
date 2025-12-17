const { Router } = require('express');
const { 
  getAllProductos, getProducto, createProducto, deleteProducto, updateProducto 
} = require('../controllers/productos.controller');
const upload = require('../config/multer');
const verifyToken = require('../middlewares/auth.middleware');

const router = Router();

router.get('/productos', getAllProductos);
router.get('/productos/:id', getProducto);
router.post('/productos', verifyToken, upload.single('imagen'), createProducto);
router.delete('/productos/:id', verifyToken, deleteProducto);
router.put('/productos/:id', verifyToken, upload.single('imagen'), updateProducto);

module.exports = router;