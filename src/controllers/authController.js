const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 

// --- ESTA ES LA FUNCIÓN QUE YA TENÍAS ---
const registerUser = async (req, res) => {
    // ... (todo tu código de registro va aquí, no lo borres)
};


// --- AÑADE TODA ESTA NUEVA FUNCIÓN ---
const loginUser = async (req, res) => {
  // 1. Extraemos correo y clave del cuerpo de la petición
  const { correo, clave } = req.body;

  if (!correo || !clave) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  }

  try {
    // 2. Buscamos al usuario en la base de datos por su correo
    const userQuery = 'SELECT * FROM usuarios WHERE correo = $1';
    const { rows } = await db.query(userQuery, [correo]);

    // 3. Si no se encuentra ningún usuario, devolvemos un error
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' }); 
    }

    const usuario = rows[0];

    // 4. Comparamos la contraseña enviada con la guardada (hasheada) en la BD
    const esClaveCorrecta = await bcrypt.compare(clave, usuario.clave_hash);

    if (!esClaveCorrecta) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' }); // Mismo mensaje genérico
    }

    // 5. Si las credenciales son correctas, creamos el Payload para el token
    const payload = {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    };

    // 6. Firmamos el token con nuestro secreto y definimos una expiración
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } 
    );

    // 7. Enviamos el token al cliente
    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token: token,
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Finalmente, exporta ambas funciones
module.exports = {
  registerUser,
  loginUser, 
};