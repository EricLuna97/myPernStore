CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    pin VARCHAR(10) DEFAULT '1234',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo_barras VARCHAR(100) UNIQUE,
    descripcion TEXT,
    precio_costo NUMERIC(10, 2) NOT NULL, 
    precio_venta NUMERIC(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE, 
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE turnos_caja (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
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

CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    turno_id INTEGER REFERENCES turnos_caja(id),
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
