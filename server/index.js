const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Servidor funcionando', fecha: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error de conexión' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});