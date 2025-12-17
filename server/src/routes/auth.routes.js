const { Router } = require('express');
const { register, login } = require('../controllers/auth.controller');

const router = Router();

// Ruta para crear cuenta
router.post('/register', register);

// Ruta para entrar (aún vacía)
router.post('/login', login);

module.exports = router;