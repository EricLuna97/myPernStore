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
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING id, nombre, email',
      [nombre, email, passwordEncriptada]
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
      { expiresIn: '1h' } 
    );

    res.json({ 
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = {
  register,
  login
};