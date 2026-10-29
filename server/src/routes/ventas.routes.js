const { Router } = require('express');
const { getAllVentas, createVenta } = require('../controllers/ventas.controller');
const verifyToken = require('../middlewares/auth.middleware');

const router = Router();

// Protegemos ambas rutas: solo personal autenticado puede ver el historial y registrar ventas
router.get('/', verifyToken, getAllVentas);
router.post('/', verifyToken, createVenta);

module.exports = router;
