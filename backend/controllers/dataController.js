const Cliente = require('../models/Cliente');
const Movil = require('../models/Movil');
const EquipoAVL = require('../models/EquipoAVL.js');
const Simcard = require('../models/Simcard');


// Controlador para manejar la búsqueda
exports.searchData = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'El término de búsqueda es obligatorio' });
    }

    console.log('Término de búsqueda recibido:', query);

    try {
        const clientes = await Cliente.find({
            $or: [
                { nombre: { $regex: query, $options: 'i' } },
                { razonSocial: { $regex: query, $options: 'i' } },
                { RUT: { $regex: query, $options: 'i' } },
                { domicilio: { $regex: query, $options: 'i' } },
                { emails: { $regex: query, $options: 'i' } },
                { 'contactos.nombre': { $regex: query, $options: 'i' } },
                { 'contactos.telefono': { $regex: query, $options: 'i' } },
                { 'contactos.email': { $regex: query, $options: 'i' } },
            ],
        });

        const moviles = await Movil.find({
            $or: [
                { patente: { $regex: query, $options: 'i' } },
                { tipo: { $regex: query, $options: 'i' } },
                { marca: { $regex: query, $options: 'i' } },
                { mandante: { $regex: query, $options: 'i' } },
                { descripcionInterna: { $regex: query, $options: 'i' } },
            ],
        });

        const equipos = await EquipoAVL.find({
            $or: [
                { IMEI: { $regex: query, $options: 'i' } },
                { numeroSerie: { $regex: query, $options: 'i' } },
                { fabricante: { $regex: query, $options: 'i' } },
                { modelo: { $regex: query, $options: 'i' } },
                { estado: { $regex: query, $options: 'i' } },
            ],
        });

        const simcards = await Simcard.find({
            $or: [
                { numeroTelefonico: { $regex: query, $options: 'i' } },
                { operador: { $regex: query, $options: 'i' } },
                { portador: { $regex: query, $options: 'i' } },
                { estado: { $regex: query, $options: 'i' } },
                { cuotaDatos: { $regex: query, $options: 'i' } },
            ],
        });


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