const express = require('express');
const cors = require('cors');

const productosRoutes = require('./src/routes/productos.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(productosRoutes); 

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});