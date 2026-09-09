# PERNSTORE - Punto de Venta (POS) Full Stack (PERN Stack)

PERNSTORE es un sistema de Punto de Venta (POS) moderno, diseñado para gestionar de manera eficiente el inventario y las transacciones de ventas de un negocio. Este proyecto implementa una arquitectura robusta utilizando el stack PERN, con énfasis en la seguridad, la experiencia de usuario fluida y la integridad de los datos financieros.

## 🚀 Características Técnicas Principales

Este sistema fue construido siguiendo buenas prácticas de desarrollo web moderno:

*   **Seguridad Industrial:** Autenticación y autorización basada en **JSON Web Tokens (JWT)**, protegiendo las rutas de administración y asegurando que solo usuarios logueados puedan realizar modificaciones.
*   **Base de Datos Robusta:** Implementación de **Transacciones SQL** en PostgreSQL para garantizar la consistencia (atomicidad) de las ventas: el sistema asegura que el dinero se registre y el stock se descuente en una operación única e indivisible, evitando datos corruptos ante fallos.
*   **Arquitectura Backend:** API RESTful escalable con Node.js y Express, utilizando `json_agg` de PostgreSQL para devolver estructuras de datos complejas (cabecera y detalles de venta) en una sola consulta.
*   **Frontend Dinámico:** Single Page Application (SPA) construida con React y Vite, utilizando **Context API** para un manejo de estado global predecible y sin fisuras en el carrito de compras.
*   **Interfaz de Usuario Moderna:** Estilizado profesional con **Tailwind CSS** y componentes de **ShadcnUI**, ofreciendo una interfaz limpia, responsiva y agradable a la vista.
*   **Gestión de Activos:** Integración con **Cloudinary** para la subida y almacenamiento seguro de imágenes de productos en la nube.

## 🛠️ Tecnologías Utilizadas

**Frontend:**
*   React 18
*   Vite
*   Tailwind CSS
*   ShadcnUI (Radix UI)
*   React Router DOM
*   React Hot Toast (Notificaciones)
*   Lucide Icons

**Backend:**
*   Node.js
*   Express
*   PostgreSQL
*   node-postgres (pg)
*   JWT (jsonwebtoken)
*   Multer (para subida de archivos)
*   Cors, Helmet, Dotenv

## ⚙️ Instalación y Configuración Local

Sigue estos pasos para levantar el proyecto en tu máquina local. Necesitas tener instalado **Node.js** y **PostgreSQL**.

### 0. Prerrequisitos

Debes crear una base de datos vacía en tu instancia de PostgreSQL (por ejemplo, llamada `pernstore_db`). Luego, ejecuta el script SQL que se encuentra en el archivo `database/init.sql` para crear las tablas necesarias (usuarios, categorías, productos, ventas, detalles_ventas).

### 1. Clonar el repositorio

```bash
git clone [https://github.com/EricLuna97/myPernStore.git](https://github.com/EricLuna97/myPernStore.git)
cd PernStore
2. Configuración del Backend (Servidor)
Bash
# Entra a la carpeta del servidor
cd server

# Instala las dependencias
npm install

# Crea y configura las variables de entorno
# Copia el archivo de ejemplo y edítalo con tus credenciales
cp .env.example .env
# ABRE EL ARCHIVO .env CREADO Y CONFIGURA TUS DATOS DE POSTGRES, CLOUDINARY Y TU JWT_SECRET

# Ejecuta el servidor en modo desarrollo
npm run dev
# El backend debería estar corriendo en http://localhost:4000
3. Configuración del Frontend (Cliente)
Bash
# Abre una nueva terminal y entra a la carpeta del cliente
cd client

# Instala las dependencias
npm install

# Ejecuta el frontend en modo desarrollo
npm run dev
# El frontend estará disponible en http://localhost:5173
📂 Estructura de la Base de Datos (Modelo Relacional)
El sistema se basa en un modelo sólido de cabecera y detalle para asegurar la integridad histórica:

usuarios: Almacena las credenciales de los administradores.

categorias: Clasificación de productos.

productos: Inventario actual con precio_costo y precio_venta.

ventas: Cabecera de la transacción (ID, fecha, total, usuario_id).

detalle_ventas: Línea por artículo de la venta (producto_id, cantidad, precio_historico). El precio histórico congela el valor al momento de la venta, protegiendo la contabilidad histórica ante cambios futuros en el catálogo.