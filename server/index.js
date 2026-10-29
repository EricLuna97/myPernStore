require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { apiLimiter } = require('./src/middlewares/rateLimiter');
const authRoutes = require('./src/routes/auth.routes');
const productosRoutes = require('./src/routes/productos.routes');
const categoriasRoutes = require('./src/routes/categorias.routes');
const ventasRoutes = require('./src/routes/ventas.routes');
const cajaRoutes = require('./src/routes/caja.routes');
const aiRoutes = require('./src/routes/ai.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Confianza en proxies inversos (Necesario en Render, Vercel y para rate-limiting seguro)
app.set('trust proxy', 1);

// 1. Cabeceras HTTP Defensivas
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

// 2. Control dinámico de CORS (Soporta localhost, CLIENT_URL y dominios de Vercel)
const origenesPermitidos = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir herramientas locales, server-to-server o health checks
    if (!origin) return callback(null, true);

    const esValido = origenesPermitidos.some(allowed => 
      origin === allowed || origin.startsWith(allowed)
    ) || origin.endsWith('.vercel.app');

    if (esValido) {
      callback(null, true);
    } else {
      callback(new Error(`Acceso bloqueado por política de CORS para el origen: ${origin}`));
    }
  },
  credentials: true 
}));

// 3. Límite razonable de payload JSON (Previene ataques de denegación de servicio por memoria)
app.use(express.json({ limit: '10mb' }));

// 4. Rate Limiting global para todas las rutas API
app.use('/api', apiLimiter);

// 5. Servir imágenes de uploads de forma estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Ruta de Health Check para Render / Monitoreo
app.get('/', (_req, res) => {
  res.json({ 
    status: 'online',
    message: 'El Motor Lógico de PernStore está activo y listo para operar en la nube.',
    timestamp: new Date().toISOString()
  });
});

// 7. Enrutadores modulares de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes); 
app.use('/api/categorias', categoriasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/ai', aiRoutes);

// 8. Manejador global de errores
app.use((err, _req, res, _next) => {
  console.error("💥 Error en la aplicación:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Ocurrió un error inesperado en el servidor."
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Motor Lógico Activo y escuchando en el puerto ${PORT}`);
});
