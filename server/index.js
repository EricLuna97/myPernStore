const express = require('express');
const cors = require('cors');
const productosRoutes = require('./src/routes/productos.routes');
const categoriasRoutes = require('./src/routes/categorias.routes');
const path = require('path');
const app = express();
const authRoutes = require('./src/routes/auth.routes');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(productosRoutes); 
app.use(categoriasRoutes);
app.use('/auth', authRoutes);
app.use(require('./src/routes/ventas.routes'));

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});