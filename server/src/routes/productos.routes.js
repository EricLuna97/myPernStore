const { Router } = require('express');
const { 
  getAllProductos, 
  getProducto, 
  createProducto, 
  deleteProducto, 
  updateProducto 
} = require('../controllers/productos.controller');
const upload = require('../config/multer');

const router = Router();

router.get('/productos', getAllProductos);
router.get('/productos/:id', getProducto);
router.post('/productos', upload.single('imagen'), createProducto);
router.delete('/productos/:id', deleteProducto);
router.put('/productos/:id', upload.single('imagen'), updateProducto);

module.exports = router;