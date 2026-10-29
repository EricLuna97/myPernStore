const jwt = require('jsonwebtoken');

// Middleware 1: Verificación de Token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ error: "Acceso denegado. No se proporcionó token de autenticación." });
  }

  const token = authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(403).json({ error: "Acceso denegado. Formato de token inválido." });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("ERROR CRÍTICO: JWT_SECRET no configurado en variables de entorno.");
      return res.status(500).json({ error: "Error interno de configuración del servidor" });
    }

    const verified = jwt.verify(token, secret);
    req.user = verified; // Contiene id, email, y rol
    next(); 

  } catch (error) {
    return res.status(401).json({ error: "Token no válido o expirado. Por favor inicia sesión nuevamente." });
  }
};

// Middleware 2: Control de Acceso Basado en Roles (RBAC)
const requireRole = (rolesPermitidos = []) => {
  const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado. Inicia sesión para continuar." });
    }

    const rolUsuario = req.user.rol || 'cajero';

    // Si el usuario es 'admin', tiene acceso irrestricto a todo el sistema
    if (rolUsuario === 'admin') {
      return next();
    }

    if (!roles.includes(rolUsuario)) {
      return res.status(403).json({ 
        error: `Acceso restringido. Se requiere rol [${roles.join(', ')}], pero tu rol actual es '${rolUsuario}'.` 
      });
    }

    next();
  };
};

// Exportamos de forma dual para máxima compatibilidad con código existente
verifyToken.verifyToken = verifyToken;
verifyToken.requireRole = requireRole;

module.exports = verifyToken;
