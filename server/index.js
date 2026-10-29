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

// 1. Cabeceras HTTP Defensivas
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

// 2. Control estricto de CORS
app.use(cors({ 
  origin: 'http://localhost:5173', 
  credentials: true 
}));

// 3. Límite razonable de payload JSON (Previene ataques de denegación de servicio por memoria)
app.use(express.json({ limit: '10mb' }));

// 4. Rate Limiting global para todas las rutas API
app.use('/api', apiLimiter);

// 5. Servir imágenes de uploads de forma estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Ruta de Health Check
app.get('/', (_req, res) => {
  res.json({ message: 'El Motor Lógico de PernStore está activo y seguro.' });
});

// 7. Enrutadores modulares de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes); 
app.use('/api/categorias', categoriasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/ai', aiRoutes);

// 8. Manejador global de errores (evita fugas de traza de stack a clientes en producción)
app.use((err, _req, res, _next) => {
  console.error("💥 Error no controlado en la aplicación:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Ocurrió un error inesperado en el servidor."
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Motor Lógico Activo y escuchando en el puerto ${PORT}`);
});
