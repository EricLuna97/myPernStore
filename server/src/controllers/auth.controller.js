const pool = require('../config/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos obligatorios." });
  }

  try {
    const userExist = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: "El correo ya está registrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, pin) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email, rol',
      [nombre, email, passwordEncriptada, 'cajero', '1234']
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};
 
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
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
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }
    
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email }, 
      secret, 
      { expiresIn: '8h' } 
    );

    res.json({ 
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol || 'cajero'
      }
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 3. Validación de PIN de Autorización en Sitio (Punto 2)
const validarPin = async (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: "Debe ingresar el PIN de autorización." });
  }

  try {
    const result = await pool.query(
      "SELECT id, nombre, email, rol FROM usuarios WHERE pin = $1",
      [String(pin).trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ autorizado: false, error: "PIN incorrecto. Autorización denegada." });
    }

    const supervisor = result.rows[0];
    res.json({
      autorizado: true,
      mensaje: `Acción autorizada por ${supervisor.nombre}`,
      supervisor: supervisor.nombre
    });
  } catch (error) {
    console.error("Error en validarPin:", error);
    res.status(500).json({ error: "Error al verificar PIN de supervisor" });
  }
};

module.exports = {
  register,
  login,
  validarPin
};
