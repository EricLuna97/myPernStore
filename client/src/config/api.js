// Configuración centralizada de endpoints de API para Desarrollo y Producción

// 1. URL base de la API (ej: https://api-pernstore.onrender.com/api o http://localhost:4000/api)
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

// 2. URL del servidor raíz (sin el sufijo /api, necesario para /uploads)
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// 3. Helper para obtener el token JWT de autenticación
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// 4. Helper para generar cabeceras de autorización estándar
export const getAuthHeaders = (extraHeaders = {}) => {
  const token = getAuthToken();
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extraHeaders
  };
};
