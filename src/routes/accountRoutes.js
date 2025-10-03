const express = require('express');
const router = express.Router();

const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/authMiddleware'); // Reutilizamos nuestro guardián

// GET /api/account - Ruta protegida para obtener los detalles de la cuenta
router.get('/', authMiddleware, accountController.getAccountDetails);

module.exports = router;