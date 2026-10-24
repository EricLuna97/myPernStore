CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_costo NUMERIC(10, 2) NOT NULL, 
    precio_venta NUMERIC(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE, 
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10, 2) NOT NULL,
    metodo_pago VARCHAR(50) DEFAULT 'efectivo',
    monto_recibido NUMERIC(10, 2) DEFAULT 0,
    vuelto NUMERIC(10, 2) DEFAULT 0,
    detalle_pago JSONB
);

CREATE TABLE detalle_ventas (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_historico NUMERIC(10, 2) NOT NULL, 
    subtotal NUMERIC(10, 2) NOT NULL
);

-- ========================================================
-- MIGRACIONES PARA BASES DE DATOS ACTIVAS:
-- (Si ya tienes tu base de datos creada, ejecuta estas sentencias en tu gestor SQL:)
-- ========================================================
-- 1. Evitar stock negativo (Punto 4):
-- ALTER TABLE productos ADD CONSTRAINT stock_no_negativo CHECK (stock >= 0);

-- 2. Registro de medios de pago y vuelto (Punto 3):
-- ALTER TABLE ventas ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50) DEFAULT 'efectivo';
-- ALTER TABLE ventas ADD COLUMN IF NOT EXISTS monto_recibido NUMERIC(10, 2) DEFAULT 0;
-- ALTER TABLE ventas ADD COLUMN IF NOT EXISTS vuelto NUMERIC(10, 2) DEFAULT 0;
-- ALTER TABLE ventas ADD COLUMN IF NOT EXISTS detalle_pago JSONB;
