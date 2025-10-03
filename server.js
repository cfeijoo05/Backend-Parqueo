require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar nuestras rutas
const authRoutes = require('./src/routes/authRoutes'); 
const vehicleRoutes = require('./src/routes/vehicleRoutes'); 
const accountRoutes = require('./src/routes/accountRoutes');
const parkingRoutes = require('./src/routes/parkingRoutes'); 

// 2. Configuración inicial
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡API del Estacionamiento funcionando!');
});

// 5. Usar las rutas importadas 
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/account', accountRoutes); 
app.use('/api/parking', parkingRoutes); 

// 6. Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});