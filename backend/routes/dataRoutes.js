const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const Cliente = require('../models/Cliente');
const EquipoAVL = require('../models/EquipoAVL');
const Movil = require('../models/Movil');
const Simcard = require('../models/Simcard');

router.get('/search', dataController.searchData);
router.get('/suggestions', dataController.getSuggestions);

router.put('/update', async (req, res) => {
    const { type, data } = req.body;

    if (!type || !data) {
        return res.status(400).json({ message: 'Faltan datos para actualizar' });
    }

    try {
        if (type === 'Cliente') {
            await Cliente.updateOne({ _id: data._id }, data);
        } else if (type === 'Movil') {
            await Movil.updateOne({ _id: data._id }, data);
        } else if (type === 'EquipoAVL') {
            await EquipoAVL.updateOne({ _id: data._id }, data);
        } else if (type === 'Simcard') {
            await Simcard.updateOne({ _id: data._id }, data);
        } else {
            return res.status(400).json({ message: 'Tipo de actualización no válido' });
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

