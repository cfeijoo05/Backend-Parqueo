const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// Ruta para el registro de usuarios 
router.post('/register', authController.registerUser);

// Ruta para el inicio de sesión de usuarios
router.post('/login', authController.loginUser);

module.exports = router;