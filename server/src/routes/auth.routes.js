const { Router } = require('express');
const { register, login, validarPin } = require('../controllers/auth.controller');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/validar-pin', validarPin);

module.exports = router;
