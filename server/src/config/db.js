const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// En entornos cloud (Supabase, Render, Railway) se utiliza DATABASE_URL con SSL habilitado
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Conexión exitosa a la Base de Datos PostgreSQL');
});

module.exports = pool;
