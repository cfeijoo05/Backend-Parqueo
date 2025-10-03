const db = require('../config/db');

const getAccountDetails = async (req, res) => {
  // Gracias al middleware, ya sabemos quién es el usuario.
  const usuario_id = req.usuario.id;

  try {
    const query = 'SELECT * FROM cuentas WHERE usuario_id = $1';
    const { rows } = await db.query(query, [usuario_id]);

    if (rows.length === 0) {
      // Esto no debería pasar si el registro funciona bien, pero es una buena validación.
      return res.status(404).json({ error: 'No se encontró la cuenta para este usuario.' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error al obtener los detalles de la cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = {
  getAccountDetails,
};