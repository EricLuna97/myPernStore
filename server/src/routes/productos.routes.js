const { Router } = require('express');
const { getAllProductos } = require('../controllers/productos.controller');

const router = Router();
router.get('/productos', getAllProductos);

module.exports = router;