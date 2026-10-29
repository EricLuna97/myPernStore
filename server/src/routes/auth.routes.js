const { Router } = require('express');
const { register, login, validarPin } = require('../controllers/auth.controller');
const { authLimiter, pinLimiter } = require('../middlewares/rateLimiter');

const router = Router();

// Rutas de autenticación con protección estricta contra ataques de fuerza bruta
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/validar-pin', pinLimiter, validarPin);

module.exports = router;
