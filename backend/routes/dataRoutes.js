const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const { searchData } = require('../controllers/dataController');

router.get('/search', searchData);
router.get('/suggestions', dataController.getSuggestions);

router.post('/cliente', dataController.createCliente);
router.post('/movil', dataController.createMovil);
router.post('/equipo', dataController.createEquipoAVL);

module.exports = router;

