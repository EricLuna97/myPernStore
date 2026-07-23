require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./src/routes/auth.routes');
const productosRoutes = require('./src/routes/productos.routes');
const categoriasRoutes = require('./src/routes/categorias.routes');
const ventasRoutes = require('./src/routes/ventas.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta de Health Check (Control de estado del servidor)
app.get('/', (req, res) => {
  res.json({ message: 'El Motor Lógico de PernStore está activo y seguro.' });
});
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes); 
app.use('/api/categorias', categoriasRoutes);
app.use('/api/ventas', ventasRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Motor Lógico Activo y escuchando en el puerto ${PORT}`);
});