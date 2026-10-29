const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Generar nombre seguro con timestamp y número aleatorio, preservando la extensión original en minúsculas
    const ext = path.extname(file.originalname).toLowerCase();
    const nombreLimpio = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nombreLimpio);
  }
});

// Extensiones y tipos MIME permitidos (Imágenes, Facturas PDF, Planillas Excel y CSV)
const EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.xlsx', '.xls', '.csv'];
const MIMETYPES_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (EXTENSIONES_PERMITIDAS.includes(ext) || MIMETYPES_PERMITIDOS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido (${ext || file.mimetype}). Solo se admiten imágenes, PDFs, Excel (.xlsx/.xls) y CSV.`));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB máximo por archivo (Evita ataques de denegación de servicio por saturación de disco)
  },
  fileFilter: fileFilter
});

module.exports = upload;
