const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  console.log("¡EL PORTERO ESTÁ REVISANDO!"); 

  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    console.log("🚫 No traía token. Acceso denegado.");
    return res.status(403).json({ error: "Acceso denegado. No hay token." });
  }

  const token = authHeader.split(' ')[1]; 

  if (!token) return res.status(403).json({ error: "Acceso denegado. Token malformado." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'palabrasecretaparamitoken123');
    req.user = verified;
    console.log("✅ Token válido. Pase usted.");
    next(); 
  } catch (error) {
    console.log("❌ Token falso o expirado.");
    res.status(401).json({ error: "Token no válido" });
  }
};

module.exports = verifyToken;