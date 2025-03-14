const Cliente = require('../models/Cliente');
const EquipoAVL = require('../models/EquipoAVL');
const Movil = require('../models/Movil');
const Simcard = require('../models/Simcard'); // Importar modelo Simcard

exports.searchData = async (req, res) => {
    const { cliente, movil, equipo, simcard } = req.query;

    console.log('\n=== INICIO DE BÚSQUEDA CON FILTROS ===');
    console.log(`Cliente: ${cliente || 'Sin filtro'}, Móvil: ${movil || 'Sin filtro'}, Equipo: ${equipo || 'Sin filtro'}, Simcard: ${simcard || 'Sin filtro'}`);

    try {
        let clientes = [];
        let moviles = [];
        let equipos = [];
        let simcards = [];

        const clienteFilter = cliente ? new RegExp(cliente, 'i') : null;
        const movilFilter = movil ? new RegExp(movil, 'i') : null;
        const equipoFilter = equipo ? equipo : null; 
        const simcardFilter = simcard ? new RegExp(simcard, 'i') : null;

        // 🔹 Filtrar clientes
        if (clienteFilter) {
            clientes = await Cliente.find({
                $or: [
                    { Cliente: clienteFilter },
                    { 'Razon Social': clienteFilter },
                    { RUT: clienteFilter },
                ],
            }).lean();
        }

        // 🔹 Filtrar móviles relacionados a clientes o con el filtro de móvil
        if (movilFilter || clienteFilter) {
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

            // Relacionar clientes desde móviles si no hay filtro de cliente
            if (!clienteFilter && moviles.length > 0) {
                const clienteNames = [...new Set(moviles.map((m) => m.Cliente))];
                clientes = await Cliente.find({ Cliente: { $in: clienteNames } }).lean();
            }
        }

        // 🔹 Filtrar equipos relacionados a móviles o con el filtro de equipo
        if (movilFilter || clienteFilter) {
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

            // Si no hay clientes pero sí móviles, obtener clientes relacionados a los móviles
            if (!clienteFilter && moviles.length > 0) {
                const clienteNames = [...new Set(moviles.map((m) => m.Cliente))];
                clientes = await Cliente.find({ Cliente: { $in: clienteNames } }).lean();
            }
        }

        // 🔹 Filtrar Equipos AVL relacionados a los móviles encontrados
        if (moviles.length > 0) {
            const equipoIds = moviles
                .map(movil => movil["Equipo Princ"]?.[""] || movil["Equipo Princ"])
                .filter(id => id); // Solo IDs válidos

            equipos = await EquipoAVL.find({ ID: { $in: equipoIds } }).lean();
        }

        // 🔹 Filtrar Simcards SOLO de los Equipos AVL encontrados
        if (equipos.length > 0) {
            const equipoIds = equipos.map(e => e.ID);
            simcards = await Simcard.find({ ID: { $in: equipoIds } }).lean();
        }

        // 🔹 Aplicar filtro manual si se busca una Simcard específica
        if (simcardFilter) {
            simcards = simcards.filter(sc => simcardFilter.test(sc.ICCID));
        }

        // 🔹 Evitar clientes duplicados
        clientes = clientes.filter((cliente, index, self) =>
            index === self.findIndex((c) => c._id.toString() === cliente._id.toString())
        );

        // 🔹 Evitar Equipos AVL duplicados
        equipos = equipos.filter((equipo, index, self) =>
            index === self.findIndex((e) => e.ID === equipo.ID)
        );

        // 🔹 Evitar Simcards duplicadas
        simcards = simcards.filter((simcard, index, self) =>
            index === self.findIndex((s) => s.ICCID === simcard.ICCID)
        );

        console.log('\n=== RESULTADOS FINALES ===');
        console.log(`Clientes: ${clientes.length}, Móviles: ${moviles.length}, Equipos: ${equipos.length}, Simcards: ${simcards.length}`);

        res.json({
            Cliente: clientes,
            Movil: moviles,
            EquipoAVL: equipos,
            Simcard: simcards,
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

// 🔹 Controlador para manejar sugerencias de búsqueda
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
                { serial: regex }
            ]
        });
        equipos.forEach(e => suggestions.add(e.imei));

        res.json([...suggestions]);
    } catch (error) {
        console.error('Error al obtener sugerencias:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Crear Cliente
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

// Crear Movil
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

// Crear Equipo AVL
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

// Crear Simcard
exports.createSimcard = async (req, res) => {
    try {
        const simcard = new Simcard(req.body);
        const savedSimcard = await simcard.save();
        res.status(201).json(savedSimcard);
    } catch (error) {
        console.error('Error al crear Simcard:', error);
        res.status(500).json({ message: 'Error al crear Simcard', error: error.message });
    }
};