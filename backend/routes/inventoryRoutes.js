const express = require('express');
const auth = require('../middleware/logMiddleware');
const router = express.Router();
const {
  listEquipos, listSimcards,
  assignEquipoToMovil, assignSimcardToEquipo
} = require('../controllers/inventoryController');

router.get('/inventario/equipos', auth, listEquipos);
router.get('/inventario/simcards', auth, listSimcards);

router.post('/inventario/asignar-equipo', auth, assignEquipoToMovil);
router.post('/inventario/asignar-simcard', auth, assignSimcardToEquipo);

module.exports = router;