-- Habilitar extensión para generar UUIDs (nativo en PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Órdenes
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY, -- El ID lo genera el código Node.js, así que no ponemos Default aquí
    customer_id UUID,
    status VARCHAR(20),
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ítems de la orden
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id),
    product_id UUID,
    quantity INT
);

-- 3. Stock de Productos (AUTO-GENERADO)
CREATE TABLE IF NOT EXISTS products_stock (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- <--- MAGIA AQUÍ
    stock INT,
    reserved_stock INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DATOS SEMILLA (Sin IDs, solo stock)
-- Producto 1: Tendrá 100 de stock (Para pruebas exitosas)
INSERT INTO products_stock (stock, reserved_stock) VALUES (100, 0);

-- Producto 2: Tendrá 0 de stock (Para pruebas de fallo)
INSERT INTO products_stock (stock, reserved_stock) VALUES (0, 0);