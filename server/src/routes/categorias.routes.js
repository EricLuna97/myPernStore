const { Router } = require('express');
const { getAllCategorias, createCategoria } = require('../controllers/categorias.controller');

const router = Router();

router.get('/', getAllCategorias);
router.post('/', createCategoria);

module.exports = router;