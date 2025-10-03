// src/controllers/parkingController.js

const db = require('../config/db');

// --- Definimos la tarifa por minuto (puedes mover esto a una configuración si lo deseas) ---
const TARIFA_POR_MINUTO = 0.17; // 5 centavos por minuto

// --- Función para INICIAR una sesión de parqueo (con duración preestablecida y cobro inmediato) ---
const startParking = async (req, res) => {
    // Ahora el frontend nos envía la placa Y la duración.
    const { placa, duracion_minutos } = req.body;
    // Obtenemos el ID del usuario desde el token, que el middleware ya verificó.
    const usuario_id = req.usuario.id; // Necesario para la cuenta

    if (!placa || !duracion_minutos) {
        return res.status(400).json({ error: 'Se requiere la placa del vehículo y la duración en minutos.' });
    }
    if (typeof duracion_minutos !== 'number' || duracion_minutos <= 0) {
        return res.status(400).json({ error: 'La duración en minutos debe ser un número positivo.' });
    }

    const client = await db.pool.connect(); // Obtenemos un cliente para la transacción

    try {
        // ¡INICIAMOS LA TRANSACCIÓN!
        await client.query('BEGIN');

        // 1. Buscamos el vehículo en la base de datos para obtener su ID.
        const vehicleQuery = 'SELECT id FROM vehiculos WHERE placa = $1 AND usuario_id = $2'; // Validamos que el vehículo sea del usuario logueado
        const vehicleResult = await client.query(vehicleQuery, [placa, usuario_id]);

        if (vehicleResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ error: `Vehículo con placa '${placa}' no encontrado para este usuario.` });
        }
        const vehiculo_id = vehicleResult.rows[0].id;

        // 2. (Validación Clave) Verificamos si este vehículo ya tiene un parqueo activo.
        const activeParkingQuery = 'SELECT id FROM parqueos WHERE vehiculo_id = $1 AND fecha_fin IS NULL';
        const activeParkingResult = await client.query(activeParkingQuery, [vehiculo_id]);

        if (activeParkingResult.rows.length > 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(409).json({ error: 'Este vehículo ya tiene una sesión de parqueo activa.' });
        }

        // 3. Calculamos el costo total del parqueo preestablecido.
        const costo_total = (duracion_minutos * TARIFA_POR_MINUTO).toFixed(2); // Aseguramos 2 decimales

        // 4. Obtenemos la cuenta del usuario para verificar saldo (BLOQUEO DE FILA).
        const accountQuery = 'SELECT id, saldo FROM cuentas WHERE usuario_id = $1 FOR UPDATE';
        const accountResult = await client.query(accountQuery, [usuario_id]);
        const cuenta = accountResult.rows[0];

        if (cuenta.saldo < costo_total) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(402).json({ error: `Saldo insuficiente. Necesitas $${costo_total} y tienes $${cuenta.saldo}.` });
        }

        // 5. Registramos el parqueo con la fecha de inicio, la duración y el costo.
        // La fecha_fin se puede calcular aquí (fecha_inicio + duracion) o dejarla en NULL si la interfaz de usuario se encarga de mostrar el tiempo restante.
        // Para este ejemplo, la calcularemos para que el registro de parqueo esté "completo".
        const fecha_inicio = new Date();
        const fecha_fin = new Date(fecha_inicio.getTime() + duracion_minutos * 60 * 1000); // Sumar minutos a la fecha de inicio

        const insertParkingQuery = `
      INSERT INTO parqueos(vehiculo_id, fecha_inicio, fecha_fin, duracion_minutos, costo, ubicacion)
      VALUES($1, $2, $3, $4, $5, NULL) -- Ubicación se puede añadir si tienes el GPS del móvil
      RETURNING id;
    `;
        const insertParkingResult = await client.query(insertParkingQuery, [
            vehiculo_id,
            fecha_inicio,
            fecha_fin,
            duracion_minutos,
            costo_total
        ]);
        const nuevoParqueoId = insertParkingResult.rows[0].id;

        // 6. Actualizamos el saldo en la cuenta del usuario.
        const saldo_anterior = cuenta.saldo;
        const saldo_posterior = parseFloat((saldo_anterior - costo_total).toFixed(2));
        const updateAccountQuery = 'UPDATE cuentas SET saldo = $1 WHERE id = $2;';
        await client.query(updateAccountQuery, [saldo_posterior, cuenta.id]);

        // 7. Creamos el registro en el "libro contable" (transacciones).
        // La plantilla SQL ahora tiene 6 placeholders ($1 a $6)
        const transactionQuery = `
        INSERT INTO transacciones(cuenta_id, parqueo_id, tipo, valor, saldo_anterior, saldo_posterior)
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING *;
        `;

        // Y aquí le pasamos los 6 valores que corresponden a cada placeholder.
        const transactionResult = await client.query(transactionQuery, [
            cuenta.id,           // 1 -> cuenta_id
            nuevoParqueoId,      // 2 -> parqueo_id
            'parqueo',           // 3 -> tipo
            -costo_total,        // 4 -> valor
            saldo_anterior,      // 5 -> saldo_anterior
            saldo_posterior      // 6 -> saldo_posterior
        ]);

        // Si todo salió bien, confirmamos la transacción
        await client.query('COMMIT');

        res.status(201).json({
            message: 'Parqueo registrado y cobrado exitosamente.',
            parqueo: {
                id: nuevoParqueoId,
                vehiculo_id: vehiculo_id,
                duracion_minutos: duracion_minutos,
                costo: costo_total,
                saldo_restante: saldo_posterior
            },
            transaccion: transactionResult.rows[0],
        });

    } catch (error) {
        // Si algo falla, revertimos todos los cambios
        await client.query('ROLLBACK');
        console.error('Error al iniciar y cobrar parqueo:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        // Liberamos al cliente
        client.release();
    }
};

// --- Dejamos endParking si el profesor aún lo requiere para alguna funcionalidad ---
// Si NO se necesita, puedes borrarla y quitarla de los exports.
// Si el 'fin' del parqueo es solo informativo o para salir antes, se podría simplificar
const endParking = async (req, res) => {
    // ... tu código existente para endParking
    // NOTA: Con el nuevo flujo, esta función podría simplificarse o eliminarse
    // ya que el cobro se hace al inicio.
    // Si necesitas una función para "finalizar" antes, aquí iría la lógica.
    // Pero el cobro ya estaría hecho.
};


module.exports = {
    startParking,
    endParking, // La dejamos si es que la necesitas para algo más, sino puedes quitarla.
};