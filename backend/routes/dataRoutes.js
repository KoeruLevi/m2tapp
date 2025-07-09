const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const Cliente = require('../models/Cliente');
const EquipoAVL = require('../models/EquipoAVL');
const Movil = require('../models/Movil');
const Simcard = require('../models/Simcard');
const HistorialCambio = require('../models/HistorialCambio');
const Usuario = require('../models/Usuario');

router.get('/search', dataController.searchData);
router.get('/suggestions', dataController.getSuggestions);
router.get('/historial', dataController.getHistorial);
router.get('/historial-cambios', async (req, res) => {
    try {
        // Filtros por query (opcional)
        const { entidad, usuarioId } = req.query;
        let filtro = {};
        if (entidad) filtro.entidad = entidad;
        if (usuarioId) filtro['usuario.id'] = usuarioId;

        const historial = await HistorialCambio.find(filtro).sort({ fecha: -1 }).limit(200).lean();
        res.json(historial);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener historial', error: error.message });
    }
});

router.get('/export-todo', async (req, res) => {
    try {
        const clientes = await Cliente.find().lean();
        const moviles = await Movil.find().lean();
        const equipos = await EquipoAVL.find().lean();
        const simcards = await Simcard.find().lean();

        res.json({
            clientes,
            moviles,
            equipos,
            simcards
        });
    } catch (err) {
        res.status(500).json({ message: 'Error al exportar datos', error: err.message });
    }
});

router.put('/update', async (req, res) => {
    const { type, data } = req.body;
    if (!type || !data) {
        return res.status(400).json({ message: 'Faltan datos para actualizar' });
    }
    try {
        let Modelo;
        if (type === 'Cliente') Modelo = Cliente;
        else if (type === 'Movil') Modelo = Movil;
        else if (type === 'EquipoAVL') Modelo = EquipoAVL;
        else if (type === 'Simcard') Modelo = Simcard;
        else return res.status(400).json({ message: 'Tipo de actualización no válido' });

        // Encuentra documento anterior
        const prevDoc = await Modelo.findById(data._id).lean();

        // Actualiza documento
        await Modelo.updateOne({ _id: data._id }, data);

        // Encuentra documento actualizado
        const newDoc = await Modelo.findById(data._id).lean();

        // Encuentra los campos que cambiaron
        let cambios = [];
        Object.keys(data).forEach((key) => {
            if (prevDoc[key] !== data[key]) {
                cambios.push({
                    campo: key,
                    valorAnterior: prevDoc[key],
                    valorNuevo: data[key]
                });
            }
        });

        // Solo registra si hubo cambios reales
        if (cambios.length > 0) {
            // Recupera usuario desde el token
            let userInfo = {};
            try {
                const token = req.headers.authorization?.replace("Bearer ", "") || req.headers['x-access-token'];
                if (token) {
                    const jwt = require("jsonwebtoken");
                    const payload = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await Usuario.findById(payload.id);
                    userInfo = {
                        id: user._id,
                        nombre: user.nombre,
                        email: user.email,
                        rol: user.rol
                    };
                }
            } catch {}

            await HistorialCambio.create({
                entidad: type,
                entidadId: data._id,
                usuario: userInfo,
                fecha: new Date(),
                cambios
            });
        }

        res.json({ message: 'Documento actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar documento:', error);
        res.status(500).json({ message: 'Error al actualizar el documento', error });
    }
});


router.post('/cliente', dataController.createCliente);
router.post('/movil', dataController.createMovil);
router.post('/equipoavl', dataController.createEquipoAVL);
router.post('/simcard', dataController.createSimcard);

module.exports = router;

