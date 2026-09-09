# PERNSTORE - Sistema de Gestión de Ventas (PERN Stack)

PERNSTORE es un sistema diseñado para gestionar el inventario y las ventas de una tienda (como demostración el rubro tecnología). Permite control de stock en tiempo real, registro de transacciones históricas y autenticación segura.

## 🚀 Tecnologías

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Base de Datos:** PostgreSQL
- **Estilos:** CSS Modules / Vanilla CSS

## ⚙️ Instalación y Configuración

Este proyecto requiere tener Node.js y PostgreSQL instalados localmente.

### 1. Clonar el repositorio
git clone https://github.com/EricLuna97/myPernStore.git
cd PernStore

### 2. Configuración del Backend
cd server
npm install

# Crea un archivo .env basado en .env.example y configura tus credenciales de PostgreSQL

npm run dev

### 3. Configuración del Frontend
cd client
npm install
npm run dev

## 🗄️ Base de Datos

Ejecuta el script `database/init.sql` (si lo tienes) o crea las tablas `productos`, `users` y `ventas` manualmente.

## ✨ Funcionalidades

- Autenticación de usuarios (JWT).
- CRUD completo de productos con gestión de imágenes.
- Carrito de compras con descuento de stock automático.
- Historial de ventas inmutable.