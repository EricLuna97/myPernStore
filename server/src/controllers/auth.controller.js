const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTRAR 
const register = async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING *',
      [nombre, email, passwordEncriptada]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

// LOGIN 
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Verificar si el usuario existe
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    // Si no devuelve filas, es que el email no existe
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    const usuario = result.rows[0];

    // 2. Verificar la contraseña
    // Comparamos la contraseña que escribió con la encriptada de la BD (usuario.password)
    const esCorrecta = await bcrypt.compare(password, usuario.password);

    if (!esCorrecta) {
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    // 3. Generar el Token
    // Guardamos el ID del usuario dentro del token para saber quién es
    const token = jwt.sign(
      { id: usuario.id }, 
      process.env.JWT_SECRET || 'palabrasecretaparamitoken123', // Usa la clave del .env
      { expiresIn: '1h' } 
    );

    // 4. Enviamos el token al usuario
    res.json({ token });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = {
  register,
  login
};