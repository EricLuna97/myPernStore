-- 1. Tabla de Categorías
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE
);

-- 2. Tabla de Productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Vamos a insertar unos datos de prueba (Seed data) para no empezar vacíos
INSERT INTO categorias (nombre) VALUES 
    ('Electrónica'), 
    ('Ropa'), 
    ('Hogar');

INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES 
    ('Laptop Gamer', 1200.50, 5, 1),
    ('Camiseta React', 25.00, 100, 2),
    ('Cafetera', 45.99, 20, 3);