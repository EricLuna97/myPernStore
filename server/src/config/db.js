const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

pool.on('connect', () => {
  console.log('✅ Conexión exitosa a la Base de Datos PostgreSQL');
});

module.exports = pool;