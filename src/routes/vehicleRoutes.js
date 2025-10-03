const express = require('express');
const router = express.Router();

const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/authMiddleware'); 

router.post('/', authMiddleware, vehicleController.addVehicle);

router.get('/', authMiddleware, vehicleController.getMyVehicles);

module.exports = router;