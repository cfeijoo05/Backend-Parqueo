const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Obtener el token del encabezado de la petición
  const authHeader = req.header('Authorization');

  // 2. Verificar si el token existe
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  const token = authHeader.split(' ')[1]; // Extraemos el token del "Bearer <token>"

  try {
    // 3. Verificar si el token es válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Si es válido, añadimos la información del usuario a la petición
    req.usuario = decoded.usuario;

    // 5. Dejamos que la petición continúe hacia el controlador
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token no válido.' });
  }
};

module.exports = authMiddleware;