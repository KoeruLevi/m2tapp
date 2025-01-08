const Cliente = require('../models/Cliente');
const EquipoAVL = require('../models/EquipoAVL');
const Movil = require('../models/Movil');


exports.searchData = async (req, res) => {
    const { cliente, movil, equipo } = req.query;

    console.log('\n=== INICIO DE BÚSQUEDA CON FILTROS ===');
    console.log(`Cliente: ${cliente || 'Sin filtro'}, Móvil: ${movil || 'Sin filtro'}, Equipo: ${equipo || 'Sin filtro'}`);

    try {
        let clientes = [];
        let moviles = [];
        let equipos = [];

        const clienteFilter = cliente ? new RegExp(cliente, 'i') : null;
        const movilFilter = movil ? new RegExp(movil, 'i') : null;
        const equipoFilter = equipo ? new RegExp(equipo, 'i') : null;

        // Filtrar clientes
        if (clienteFilter) {
            console.log('\n=== FILTRANDO POR CLIENTE ===');
            clientes = await Cliente.find({
                $or: [
                    { Cliente: clienteFilter },
                    { 'Razon Social': clienteFilter },
                    { RUT: clienteFilter },
                ],
            }).lean();
            console.log('Clientes filtrados:', clientes);
        }

        // Filtrar móviles relacionados a clientes o con el filtro de móvil
        if (movilFilter || clienteFilter) {
            console.log('\n=== FILTRANDO POR MÓVIL ===');
            const movilQuery = {
                ...(movilFilter && {
                    $or: [
                        { Marca: movilFilter },
                        { Tipo: movilFilter },
                        { Patente: movilFilter },
                    ],
                }),
                ...(clienteFilter && { Cliente: { $in: clientes.map((c) => c.Cliente) } }),
            };

            moviles = await Movil.find(movilQuery).lean();
            console.log('Móviles filtrados:', moviles);

            // Relacionar clientes desde móviles si no hay filtro de cliente
            if (!clienteFilter && moviles.length > 0) {
                const clienteNames = [...new Set(moviles.map((m) => m.Cliente))];
                console.log('Clientes relacionados desde móviles:', clienteNames);
                clientes = await Cliente.find({ Cliente: { $in: clienteNames } }).lean();
            }
        }

        // Filtrar equipos relacionados a móviles o con el filtro de equipo
        if (equipoFilter || moviles.length > 0) {
            console.log('\n=== FILTRANDO POR EQUIPO AVL ===');

            // Normalizar los valores del campo "Equipo Princ" en móviles
            const equipoIds = moviles
                .map((m) => m['Equipo Princ'])
                .filter((e) => e && typeof e === 'object' && e[''])
                .map((e) => e['']);

            console.log('IDs de equipos normalizados:', equipoIds);

            const equipoQuery = {
                ...(equipoFilter && {
                    $or: [
                        { imei: equipoFilter },
                        { serial: equipoFilter },
                        { model: equipoFilter },
                        { ID: equipoFilter },
                    ],
                }),
                ...(equipoIds.length > 0 && { ID: { $in: equipoIds } }),
            };

            equipos = await EquipoAVL.find(equipoQuery).lean();
            console.log('Equipos filtrados:', equipos);

            // Relacionar móviles desde equipos si no hay filtro de móvil
            if (!movilFilter && equipos.length > 0) {
                const relatedMovilIds = equipos.map((e) => e.ID);
                console.log('IDs de móviles relacionados desde equipos:', relatedMovilIds);

                const relatedMoviles = await Movil.find({
                    'Equipo Princ': { $in: relatedMovilIds.map((id) => ({ '': id })) },
                }).lean();

                console.log('Móviles relacionados desde equipos:', relatedMoviles);

                moviles = [...moviles, ...relatedMoviles];
            }
        }

        console.log('\n=== RESULTADOS FINALES ===');
        console.log(`Clientes: ${clientes.length}, Móviles: ${moviles.length}, Equipos: ${equipos.length}`);

        res.json({
            Cliente: clientes,
            Movil: moviles,
            EquipoAVL: equipos,
        });
    } catch (error) {
        console.error('\n=== ERROR EN LA BÚSQUEDA ===');
        console.error(error);
        res.status(500).json({
            message: 'Error al realizar la búsqueda',
            error: error.message,
        });
    }
};

// Función para extraer valores de "Equipo Princ"
const extractEquipoPrinc = (equipoPrincField) => {
    if (typeof equipoPrincField === 'number') {
        return equipoPrincField;
    } else if (typeof equipoPrincField === 'object' && equipoPrincField !== null) {
        const values = Object.values(equipoPrincField);
        return values.find((val) => typeof val === 'number') || null;
    }
    return null;
};

// Controlador para manejar sugerencias de búsqueda
exports.getSuggestions = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'El término de búsqueda es obligatorio' });
    }

    try {
        const regex = new RegExp(query, 'i');
        const suggestions = new Set();

        // Buscar sugerencias en clientes
        const clientes = await Cliente.find({
            $or: [
                { Cliente: regex },
                { "Razon Social": regex },
                { RUT: regex }
            ]
        });
        clientes.forEach(c => suggestions.add(c.Cliente).add(c["Razon Social"]).add(c.RUT));

        // Buscar sugerencias en móviles
        const moviles = await Movil.find({
            $or: [
                { Cliente: regex },
                { Marca: regex },
                { Patente: regex }
            ]
        });
        moviles.forEach(m => suggestions.add(m.Cliente).add(m.Marca).add(m.Patente));

        // Buscar sugerencias en equipos
        const equipos = await EquipoAVL.find({
            $or: [
                { imei: regex },
                { serial: regex },
                { model: regex }
            ]
        });
        equipos.forEach(e => suggestions.add(e.imei).add(e.model));

        res.json([...suggestions]);
    } catch (error) {
        console.error('Error al obtener sugerencias:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};



exports.createCliente = async (req, res) => {
    try {
        const cliente = new Cliente(req.body);
        const savedCliente = await cliente.save();
        res.status(201).json(savedCliente);
    } catch (error) {
        console.error('Error al crear Cliente:', error);
        res.status(500).json({ message: 'Error al crear Cliente', error: error.message });
    }
};

// Crear nuevo Movil
exports.createMovil = async (req, res) => {
    try {
        const movil = new Movil(req.body);
        const savedMovil = await movil.save();
        res.status(201).json(savedMovil);
    } catch (error) {
        console.error('Error al crear Movil:', error);
        res.status(500).json({ message: 'Error al crear Movil', error: error.message });
    }
};

// Crear nuevo EquipoAVL
exports.createEquipoAVL = async (req, res) => {
    try {
        const equipo = new EquipoAVL(req.body);
        const savedEquipo = await equipo.save();
        res.status(201).json(savedEquipo);
    } catch (error) {
        console.error('Error al crear EquipoAVL:', error);
        res.status(500).json({ message: 'Error al crear EquipoAVL', error: error.message });
    }
};