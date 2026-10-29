const pool = require('../config/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Registro de Usuarios (Protegido contra auto-registro no autorizado)
const register = async (req, res) => {
  const { nombre, email, password, rol, pin } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos obligatorios (nombre, email, password)." });
  }

  try {
    // Control de Seguridad: Si ya existen usuarios en el sistema, solo un 'admin' autenticado puede crear nuevos cajeros o supervisores
    const totalUsuariosResult = await pool.query('SELECT COUNT(*) FROM usuarios');
    const esPrimerUsuario = parseInt(totalUsuariosResult.rows[0].count, 10) === 0;

    if (!esPrimerUsuario) {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(403).json({ 
          error: "Acceso denegado. En un sistema de punto de venta, solo un Administrador autenticado puede dar de alta nuevos usuarios." 
        });
      }

      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.rol !== 'admin') {
          return res.status(403).json({ error: "Acceso denegado. Se requiere rol de Administrador para crear usuarios." });
        }
      } catch (_) {
        return res.status(401).json({ error: "Token de administrador no válido o expirado." });
      }
    }

    const userExist = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: "El correo electrónico ya está registrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // El primer usuario del sistema siempre se crea como admin; los subsiguientes según lo que envíe el admin
    const rolFinal = esPrimerUsuario ? 'admin' : (rol || 'cajero');
    const pinFinal = pin && String(pin).trim() ? String(pin).trim() : '1234';

    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, pin) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email, rol',
      [nombre.trim(), email.toLowerCase().trim(), passwordEncriptada, rolFinal, pinFinal]
    );

    res.status(201).json({
      message: esPrimerUsuario 
        ? "¡Primer usuario administrador configurado exitosamente!" 
        : "Nuevo usuario registrado exitosamente.",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Error en register:", error.message);
    res.status(500).json({ error: "Error al registrar usuario en el servidor" });
  }
};
 
// 2. Inicio de Sesión
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Debes ingresar tu correo y contraseña." });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    
    // Mensaje genérico para evitar enumeración de usuarios
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    const usuario = result.rows[0];
    const esCorrecta = await bcrypt.compare(password, usuario.password);

    if (!esCorrecta) {
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("CRITICAL ERROR: Faltan variables de entorno (JWT_SECRET).");
      return res.status(500).json({ error: "Error de configuración interna del servidor" });
    }
    
    // Incluimos explícitamente el 'rol' dentro del payload del token JWT
    const rolUsuario = usuario.rol || 'cajero';
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email,
        rol: rolUsuario 
      }, 
      secret, 
      { expiresIn: '8h' } 
    );

    res.json({ 
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: rolUsuario
      }
    });

  } catch (error) {
    console.error("Error en login:", error.message);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
};

// 3. Validación de PIN de Autorización en Sitio (Exclusivo para Supervisores y Administradores)
const validarPin = async (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: "Debe ingresar el PIN de autorización." });
  }

  try {
    // Verificamos que el PIN pertenezca ESTRICTAMENTE a un Supervisor o Administrador
    const result = await pool.query(
      "SELECT id, nombre, email, rol FROM usuarios WHERE pin = $1 AND (rol = 'supervisor' OR rol = 'admin')",
      [String(pin).trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        autorizado: false, 
        error: "PIN inválido o no pertenece a un Supervisor/Administrador autorizado." 
      });
    }

    const supervisor = result.rows[0];
    res.json({
      autorizado: true,
      supervisor: {
        id: supervisor.id,
        nombre: supervisor.nombre,
        rol: supervisor.rol
      }
    });

  } catch (error) {
    console.error("Error en validarPin:", error.message);
    res.status(500).json({ error: "Error interno al validar autorización" });
  }
};

module.exports = {
  register,
  login,
  validarPin
};
