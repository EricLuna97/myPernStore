const { Router } = require('express');
const { getEstadoCaja, abrirCaja, cerrarCaja } = require('../controllers/caja.controller');
const verifyToken = require('../middlewares/auth.middleware');

const router = Router();

// Todas las rutas de caja requieren autenticación
router.get('/estado', verifyToken, getEstadoCaja);
router.post('/abrir', verifyToken, abrirCaja);
router.post('/cerrar', verifyToken, cerrarCaja);

module.exports = router;

