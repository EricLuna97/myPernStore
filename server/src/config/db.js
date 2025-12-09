const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' }); 
// OJO: Agregué path: '../../.env' para asegurarnos que encuentre el archivo .env 
// ya que ahora db.js está dos niveles más adentro.

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