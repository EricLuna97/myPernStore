const { Router } = require('express');
const { getAllProductos, createProducto } = require('../controllers/productos.controller');

const router = Router();

router.get('/productos', getAllProductos);

router.post('/productos', createProducto);

module.exports = router;