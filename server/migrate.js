const pool = require('./src/config/db');

async function ejecutarMigracion() {
  console.log('🔄 Conectando a PostgreSQL y aplicando migraciones...');

  try {
    // 1. Evitar stock negativo (Punto 4)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'stock_no_negativo'
        ) THEN
          ALTER TABLE productos ADD CONSTRAINT stock_no_negativo CHECK (stock >= 0);
        END IF;
      END $$;
    `);
    console.log('  ✓ [Punto 4] Restricción de stock no negativo asegurada.');

    // 2. Medios de pago y vuelto en ventas (Punto 3)
    await pool.query(`ALTER TABLE ventas ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50) DEFAULT 'efectivo';`);
    await pool.query(`ALTER TABLE ventas ADD COLUMN IF NOT EXISTS monto_recibido NUMERIC(10, 2) DEFAULT 0;`);
    await pool.query(`ALTER TABLE ventas ADD COLUMN IF NOT EXISTS vuelto NUMERIC(10, 2) DEFAULT 0;`);
    await pool.query(`ALTER TABLE ventas ADD COLUMN IF NOT EXISTS detalle_pago JSONB;`);
    console.log('  ✓ [Punto 3] Columnas metodo_pago, monto_recibido, vuelto y detalle_pago agregadas a ventas.');

    // 3. Códigos de barras en productos (Punto 1)
    await pool.query(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(100) UNIQUE;`);
    console.log('  ✓ [Punto 1] Columna codigo_barras agregada a productos.');

    console.log('\n🚀 ¡Migraciones aplicadas con éxito en la base de datos PERNstore!');
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || (error.errors && error.errors[0]?.code === 'ECONNREFUSED')) {
      console.error('\n⚠️  ERROR DE CONEXIÓN (ECONNREFUSED):');
      console.error('El servicio de PostgreSQL está apagado o no está escuchando en el puerto 5432.');
      console.error('👉 Solución: Inicia el servicio de PostgreSQL en Windows (o abre pgAdmin / Docker) y vuelve a ejecutar este comando.');
    } else {
      console.error('\n❌ Error al aplicar las migraciones:', error.message || error);
    }
  } finally {
    await pool.end();
  }
}

ejecutarMigracion();
