const { Router } = require('express');
const multer = require('multer'); 
const path = require('path');
const { getAllProductos, createProducto, deleteProducto } = require('../controllers/productos.controller');

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// RUTAS
router.get('/productos', getAllProductos);

router.post('/productos', upload.single('imagen'), createProducto);

router.delete('/productos/:id', deleteProducto);

module.exports = router;