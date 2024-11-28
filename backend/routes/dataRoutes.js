const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Ruta para manejar la búsqueda
router.get('/search', dataController.searchData);

module.exports = router;