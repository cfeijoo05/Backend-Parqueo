const db = require('../config/db');

// --- Función para AÑADIR un vehículo ---
const addVehicle = async (req, res) => {
  // Obtenemos los datos del vehículo del cuerpo de la petición
  const { placa, marca, color } = req.body;
  // ¡IMPORTANTE! Obtenemos el ID del usuario desde el token, que el middleware ya verificó
  const usuario_id = req.usuario.id;

  try {
    const query = `
      INSERT INTO vehiculos(usuario_id, placa, marca, color)
      VALUES($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [usuario_id, placa, marca, color]);
    res.status(201).json({ message: 'Vehículo añadido exitosamente.', vehiculo: rows[0] });
  } catch (error) {
    console.error('Error al añadir vehículo:', error);
    // Error común: la placa ya existe (violación de constraint UNIQUE)
    if (error.code === '23505') {
        return res.status(400).json({ error: `La placa '${placa}' ya está registrada.` });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// --- Función para OBTENER los vehículos de un usuario ---
const getMyVehicles = async (req, res) => {
  // El ID del usuario también viene del token gracias al middleware
  const usuario_id = req.usuario.id;

  try {
    const query = 'SELECT * FROM vehiculos WHERE usuario_id = $1 ORDER BY created_at DESC';
    const { rows } = await db.query(query, [usuario_id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = {
  addVehicle,
  getMyVehicles,
};