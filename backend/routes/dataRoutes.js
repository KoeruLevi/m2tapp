const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Endpoint para buscar datos
router.get('/search', dataController.searchData);

// Endpoint para sugerencias
router.get('/suggestions', dataController.getSuggestions);

module.exports = router;