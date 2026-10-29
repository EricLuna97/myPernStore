const rateLimit = require('express-rate-limit');

// 1. Limitador estricto para Login (Prevención de ataques de fuerza bruta en contraseñas)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos por IP
  standardHeaders: true, // Devuelve información de RateLimit en las cabeceras estándar
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos fallidos de inicio de sesión desde esta IP. Por seguridad, espera 15 minutos."
  }
});

// 2. Limitador ultra-estricto para PIN de Supervisor (Evita adivinar PINs de 4 dígitos)
const pinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // Máximo 5 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos de validación de PIN. Bloqueado temporalmente por 10 minutos para proteger la caja."
  }
});

// 3. Limitador general para el resto de la API (Prevención de ataques de denegación de servicio - DoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Máximo 1000 peticiones cada 15 min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Límite de solicitudes excedido. Por favor intenta de nuevo en unos minutos."
  }
});

module.exports = {
  authLimiter,
  pinLimiter,
  apiLimiter
};

