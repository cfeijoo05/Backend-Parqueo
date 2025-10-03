const express = require('express');
const router = express.Router();

const parkingController = require('../controllers/parkingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/start', authMiddleware, parkingController.startParking);
router.post('/end', authMiddleware, parkingController.endParking);


module.exports = router;