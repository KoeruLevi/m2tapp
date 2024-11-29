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


    try { HEAD
        const results = [];

        // Búsqueda en Simcard
        const simcards = await Simcard.find({
            $or: [
                { numeroTelefonico: { $regex: query, $options: 'i' } },
                { operador: { $regex: query, $options: 'i' } },
                { portador: { $regex: query, $options: 'i' } },
                { estado: { $regex: query, $options: 'i' } },
            ],
        }).lean(); // .lean() para devolver objetos simples

        const clientes = await Cliente.find({ nombre: { $regex: query, $options: 'i' } });
        console.log('Resultados en Cliente:', clientes);

    try {
        const clientes = await Cliente.find({ nombre: { $regex: query, $options: 'i' } });
        console.log('Resultados en Cliente:', clientes);


        const moviles = await Movil.find({ patente: { $regex: query, $options: 'i' } });
        console.log('Resultados en Movil:', moviles);

        const equipos = await EquipoAVL.find({ numeroSerie: { $regex: query, $options: 'i' } });
        console.log('Resultados en EquipoAVL:', equipos);

        const simcards = await Simcard.find({ numeroTelefonico: { $regex: query, $options: 'i' } });
        console.log('Resultados en Simcard:', simcards);



        const moviles = await Movil.find({ patente: { $regex: query, $options: 'i' } });
        console.log('Resultados en Movil:', moviles);

        const equipos = await EquipoAVL.find({ numeroSerie: { $regex: query, $options: 'i' } });
        console.log('Resultados en EquipoAVL:', equipos);

        const simcards = await Simcard.find({ numeroTelefonico: { $regex: query, $options: 'i' } });
        console.log('Resultados en Simcard:', simcards);
        

        for (const simcard of simcards) {
            const equipo = await EquipoAVL.findById(simcard.equipoAVL_id).lean();
            if (equipo) {
                simcard.equipo = equipo;

                const movil = await Movil.findById(equipo.movil_id).lean();
                if (movil) {
                    equipo.movil = movil;

                    const cliente = await Cliente.findById(movil.cliente_id).lean();
                    if (cliente) {
                        movil.cliente = cliente;

                        // Relacionar todos los moviles del cliente
                        const otrosMoviles = await Movil.find({ _id: { $in: cliente.moviles_ids } }).lean();
                        cliente.otrosMoviles = otrosMoviles;
                    }

                    // Obtener otros equipos del mismo movil
                    const equiposSecundarios = await EquipoAVL.find({
                        _id: { $in: [movil.equipoPrimario, movil.equipoSecundario] },
                    }).lean();
                    movil.otrosEquipos = equiposSecundarios;
                }
            }
            results.push(simcard);
        }

        res.json(results);
    } catch (error) {
        console.error('Error al realizar la búsqueda:', error.message);
        res.status(500).json({ message: 'Error al realizar la búsqueda', error: error.message });
    }
};