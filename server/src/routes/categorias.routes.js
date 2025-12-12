const { Router } = require('express');
const { getAllCategorias, createCategoria } = require('../controllers/categorias.controller');

const router = Router();

router.get('/categorias', getAllCategorias);
router.post('/categorias', createCategoria);

module.exports = router;