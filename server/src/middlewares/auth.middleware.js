const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ error: "Acceso denegado. No hay token." });
  }

  const token = authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(403).json({ error: "Acceso denegado. Formato de token inválido." });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return res.status(500).json({ error: "Error interno del servidor" });
    }

    const verified = jwt.verify(token, secret);
    req.user = verified;
    next(); 

  } catch (error) {
    res.status(401).json({ error: "Token no válido o expirado" });
  }
};

module.exports = verifyToken;