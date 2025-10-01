const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const auth = require('../middleware/logMiddleware.js');
const Usuario = require('../models/Usuario');
const isAdmin = require('../middleware/isAdmin');
router.get('/search',        dataController.searchData);
router.get('/suggestions',   dataController.getSuggestions);
router.get('/historial',     dataController.getHistorial);

router.get('/historial-cambios', async (req, res) => {
  try {
    const { HistorialCambio } = req.models;
    const { entidad, usuarioId } = req.query;

    const filtro = {};
    if (entidad)  filtro.entidad = entidad;
    if (usuarioId) filtro['usuario.id'] = usuarioId;

    const historial = await HistorialCambio.find(filtro)
      .sort({ fecha: -1 })
      .limit(200)
      .lean();
    const userIds = [
      ...new Set(
        historial
          .map(h => (h.usuario && h.usuario.id ? h.usuario.id.toString() : null))
          .filter(Boolean)
      )
    ];

    if (userIds.length) {
      const usuarios = await Usuario.find(
        { _id: { $in: userIds } },
        { nombre: 1, email: 1, rol: 1 }
      ).lean();

      const userDict = {};
      usuarios.forEach(u => { userDict[u._id.toString()] = u; });

      historial.forEach(h => {
        if (h.usuario && h.usuario.id) {
          const u = userDict[h.usuario.id.toString()];
          if (u) {
            h.usuario.nombre = u.nombre;
            h.usuario.email  = u.email;
            h.usuario.rol    = u.rol;
          }
        }
      });
    }

    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial', error: error.message });
  }
});

router.get('/export-todo', async (req, res) => {
  try {
    const { Cliente, Movil, EquipoAVL, Simcard } = req.models;

    const [clientes, moviles, equipos, simcards] = await Promise.all([
      Cliente.find().lean(),
      Movil.find().lean(),
      EquipoAVL.find().lean(),
      Simcard.find().lean()
    ]);

    res.json({ clientes, moviles, equipos, simcards });
  } catch (err) {
    res.status(500).json({ message: 'Error al exportar datos', error: err.message });
  }
});

router.put('/update', auth, dataController.updateDocumento);

router.delete('/delete/:tipo/:id', auth, isAdmin, dataController.deleteDocumento);

router.post('/cliente',   dataController.createCliente);
router.post('/movil',     dataController.createMovil);
router.post('/equipoavl', dataController.createEquipoAVL);
router.post('/simcard',   dataController.createSimcard);

module.exports = router;