const { Router } = require('express');
const { getAllCategorias, createCategoria } = require('../controllers/categorias.controller');
const verifyToken = require('../middlewares/auth.middleware');

const router = Router();

// El catálogo de categorías puede consultarse para el POS, pero la creación requiere autenticación
router.get('/', getAllCategorias);
router.post('/', verifyToken, createCategoria);

module.exports = router;
