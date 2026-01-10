const express = require('express');
const router = express.Router();
const { analyzeProduct } = require('../controllers/aiProductController');

// Ruta: POST /api/ai/analyze-product
router.post('/analyze-product', analyzeProduct);

module.exports = router;