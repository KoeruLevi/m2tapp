const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const auth = require('../middleware/logMiddleware.js');
// Si más adelante quieres limitar por rol:
// const isAdmin = require('../middleware/isAdmin');

const Usuario = require('../models/Usuario');

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

router.put('/update', auth, async (req, res) => {
  const { type, data } = req.body;
  if (!type || !data) {
    return res.status(400).json({ message: 'Faltan datos para actualizar' });
  }

  try {
    const { Cliente, Movil, EquipoAVL, Simcard, HistorialCambio } = req.models;

    let Modelo;
    if (type === 'Cliente') Modelo = Cliente;
    else if (type === 'Movil') Modelo = Movil;
    else if (type === 'EquipoAVL') Modelo = EquipoAVL;
    else if (type === 'Simcard') Modelo = Simcard;
    else return res.status(400).json({ message: 'Tipo de actualización no válido' });

    if (type === 'Movil') {
      const raw = data['Equipo Princ'];
      if (raw != null) {
        const n =
          typeof raw === 'object' ? Number(raw.ID || raw[''] || raw) : Number(raw);
        data['Equipo Princ'] = Number.isFinite(n) ? { '': n } : data['Equipo Princ'];
      }
    }

    const prevDoc = await Modelo.findById(data._id).lean();
    await Modelo.updateOne({ _id: data._id }, data);
    const newDoc = await Modelo.findById(data._id).lean();

    const cambios = [];
    Object.keys(data).forEach((key) => {
      if (prevDoc?.[key] !== newDoc?.[key]) {
        cambios.push({
          campo: key,
          valorAnterior: prevDoc?.[key],
          valorNuevo: newDoc?.[key],
        });
      }
    });

    if (cambios.length > 0) {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuario no autenticado para registrar cambios.' });
      }
      await HistorialCambio.create({
        entidad: type,
        entidadId: data._id,
        usuario: {
          id: req.user._id,
          nombre: req.user.nombre,
          email: req.user.email,
          rol: req.user.rol,
        },
        fecha: new Date(),
        cambios,
      });
    }

    res.json({ message: 'Documento actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({ message: 'Error al actualizar el documento', error: error.message });
  }
});

router.delete('/delete/:tipo/:id', auth, dataController.deleteDocumento);

router.post('/cliente',   dataController.createCliente);
router.post('/movil',     dataController.createMovil);
router.post('/equipoavl', dataController.createEquipoAVL);
router.post('/simcard',   dataController.createSimcard);

module.exports = router;