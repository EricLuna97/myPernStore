const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const productosRoutes = require('./src/routes/productos.routes');
const categoriasRoutes = require('./src/routes/categorias.routes');
const ventasRoutes = require('./src/routes/ventas.routes');
const path = require('path');
const app = express();
const authRoutes = require('./src/routes/auth.routes');
const PORT = process.env.PORT || 3000;

// Configuración de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(productosRoutes); 
app.use(categoriasRoutes);
app.use('/auth', authRoutes);
app.use(ventasRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});