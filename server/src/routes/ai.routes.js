const { Router } = require('express');
const { analizarFactura } = require('../controllers/ai.controller');
const upload = require('../config/multer');
const verifyToken = require('../middlewares/auth.middleware');

const router = Router();

// Subida de imagen o archivo tabular (Excel .xlsx/.xls, CSV)
router.post('/analizar-factura', verifyToken, upload.single('factura'), analizarFactura);
router.post('/analizar-archivo', verifyToken, upload.single('factura'), analizarFactura);

module.exports = router;
