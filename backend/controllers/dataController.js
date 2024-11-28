const Cliente = require('../models/Cliente');
const Movil = require('../models/Movil');
const EquipoAVL = require('../models/EquipoAVL.js');
const Simcard = require('../models/Simcard');
const Usuario = require('../models/Usuario');

// Controlador para manejar la búsqueda
exports.searchData = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'El término de búsqueda es obligatorio' });
    }

    console.log('Término de búsqueda recibido:', query);

    try {
        const clientes = await Cliente.find({ nombre: { $regex: query, $options: 'i' } });
        console.log('Resultados en Cliente:', clientes);


        const moviles = await Movil.find({ patente: { $regex: query, $options: 'i' } });
        console.log('Resultados en Movil:', moviles);

        const equipos = await EquipoAVL.find({ numeroSerie: { $regex: query, $options: 'i' } });
        console.log('Resultados en EquipoAVL:', equipos);

        const simcards = await Simcard.find({ numeroTelefonico: { $regex: query, $options: 'i' } });
        console.log('Resultados en Simcard:', simcards);


        const results = [
            ...clientes.map((item) => ({ ...item.toObject(), tipo: 'Cliente' })),
            ...moviles.map((item) => ({ ...item.toObject(), tipo: 'Movil' })),
            ...equipos.map((item) => ({ ...item.toObject(), tipo: 'Equipo AVL' })),
            ...simcards.map((item) => ({ ...item.toObject(), tipo: 'Simcard' })),
        ];

        console.log('Resultados combinados:', results);
        res.json(results);
    } catch (error) {
        console.error('Error en el controlador de búsqueda:', error.message);
        res.status(500).json({ message: 'Error al realizar la búsqueda', error: error.message });
    }
};