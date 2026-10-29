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

    // 4. Asegurar que la tabla usuarios tenga Primary Key / Unique en 'id'
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          WHERE t.relname = 'usuarios' AND c.contype = 'p'
        ) THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'usuarios' AND column_name = 'id'
          ) THEN
            ALTER TABLE usuarios ADD PRIMARY KEY (id);
          END IF;
        END IF;
      END $$;
    `);

    // 5. Columnas rol y pin en usuarios (Punto 2 y Seguridad RBAC)
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'admin';`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pin VARCHAR(10) DEFAULT '1234';`);
    await pool.query(`UPDATE usuarios SET pin = '1234' WHERE pin IS NULL;`);
    // Asegurar que el usuario principal/dueño tenga rol admin
    await pool.query(`UPDATE usuarios SET rol = 'admin' WHERE id = (SELECT MIN(id) FROM usuarios) AND (rol IS NULL OR rol = 'cajero');`);
    console.log('  ✓ [Punto 2] Columnas rol y pin (PIN: 1234) aseguradas en usuarios y rol admin verificado.');

    // 6. Tabla turnos_caja creada de forma segura
    await pool.query(`
      CREATE TABLE IF NOT EXISTS turnos_caja (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER,
        fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_cierre TIMESTAMP,
        monto_inicial NUMERIC(10, 2) NOT NULL,
        monto_ventas_efectivo NUMERIC(10, 2) DEFAULT 0,
        monto_ventas_otros NUMERIC(10, 2) DEFAULT 0,
        total_esperado NUMERIC(10, 2),
        monto_real_cierre NUMERIC(10, 2),
        diferencia NUMERIC(10, 2),
        observaciones TEXT,
        estado VARCHAR(20) DEFAULT 'abierto'
      );
    `);

    // Vincular Foreign Key de usuario si existe la clave en usuarios
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_turnos_usuario'
        ) THEN
          IF EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'usuarios' AND c.contype IN ('p', 'u')
          ) THEN
            ALTER TABLE turnos_caja ADD CONSTRAINT fk_turnos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
          END IF;
        END IF;
      END $$;
    `);
    console.log('  ✓ [Punto 2] Tabla turnos_caja creada y vinculada.');

    // 7. Columna turno_id en ventas
    await pool.query(`ALTER TABLE ventas ADD COLUMN IF NOT EXISTS turno_id INTEGER REFERENCES turnos_caja(id);`);
    console.log('  ✓ [Punto 2] Columna turno_id vinculada a ventas.');

    console.log('\n🚀 ¡Todas las migraciones fueron aplicadas con éxito en la base de datos PERNstore!');
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || (error.errors && error.errors[0]?.code === 'ECONNREFUSED')) {
      console.error('\n⚠️  ERROR DE CONEXIÓN (ECONNREFUSED):');
      console.error('El servicio de PostgreSQL está apagado o no está escuchando en el puerto 5432.');
    } else {
      console.error('\n❌ Error al aplicar las migraciones:', error.message || error);
    }
  } finally {
    await pool.end();
  }
}

ejecutarMigracion();
