const { Router } = require('express');
const { getAllVentas, createVenta } = require('../controllers/ventas.controller');
const verifyToken = require('../middlewares/auth.middleware');

const router = Router();

// El prefijo '/api/ventas' ya viene delegado desde index.js
router.get('/', getAllVentas);

// Protegemos la ruta: solo un cajero/usuario autenticado puede registrar ventas
router.post('/', verifyToken, createVenta);

module.exports = router;