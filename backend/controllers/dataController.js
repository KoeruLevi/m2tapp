const Cliente = require('../models/Cliente');
const EquipoAVL = require('../models/EquipoAVL');
const Movil = require('../models/Movil');


exports.searchData = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'El término de búsqueda es obligatorio' });
    }

    try {
        const searchTerm = query.trim();
        if (!searchTerm) {
            throw new Error('El término de búsqueda está vacío después de recortar espacios.');
        }

        console.log('\n=== INICIO DE BÚSQUEDA ===');
        console.log(`Término de búsqueda: "${searchTerm}"`);

        const regex = new RegExp(searchTerm, 'i');
        const numericTerm = !isNaN(searchTerm) ? Number(searchTerm) : null;

        let clientes = [];
        let moviles = [];
        let equipos = [];

        // === Búsqueda inicial en Cliente ===
        console.log('\n=== BÚSQUEDA INICIAL EN CLIENTE ===');
        clientes = await Cliente.find({
            $or: [
                { Cliente: regex },
                { 'Razon Social': regex },
                { RUT: regex },
            ],
        }).lean();
        console.log('Clientes encontrados inicialmente:', clientes);

        // === Búsqueda inicial en Movil ===
        console.log('\n=== BÚSQUEDA INICIAL EN MOVIL ===');
        moviles = await Movil.find({
            $or: [
                { Cliente: regex },
                { Patente: regex },
                { Marca: regex },
                { Tipo: regex },
            ],
        }).lean();
        console.log('Móviles encontrados inicialmente:', moviles);

        // === Búsqueda inicial en EquipoAVL ===
        console.log('\n=== BÚSQUEDA INICIAL EN EQUIPOAVL ===');
        equipos = await EquipoAVL.find({
            $or: [
                { imei: numericTerm || regex },
                { serial: numericTerm || regex },
                { model: regex },
                { ID: numericTerm },
            ],
        }).lean();
        console.log('Equipos encontrados inicialmente:', equipos);

        // === Propagación desde EquipoAVL ===
        if (equipos.length > 0) {
            console.log('\n=== PROPAGACIÓN DESDE EQUIPOAVL ===');
            const equipoIds = equipos.map((equipo) => equipo.ID).filter(Boolean);
            console.log('IDs de equipos extraídos de EquipoAVL:', equipoIds);

            const movilesPorEquipo = await Movil.find().lean();
            const movilesRelacionados = movilesPorEquipo.filter((movil) => {
                const equipoPrinc = movil['Equipo Princ'];
                const extractedId = extractEquipoPrinc(equipoPrinc);
                return equipoIds.includes(extractedId);
            });
            console.log('Móviles encontrados por equipos:', movilesRelacionados);

            moviles = [...moviles, ...movilesRelacionados];
            console.log('Estado actual de Móviles después de búsqueda por equipos:', moviles);

            const clienteNames = movilesRelacionados.map((movil) => movil.Cliente).filter(Boolean);
            console.log('Clientes extraídos de Móviles:', clienteNames);

            const clientesPorEquipo = await Cliente.find({
                Cliente: { $in: clienteNames },
            }).lean();
            console.log('Clientes encontrados por móviles relacionados a equipos:', clientesPorEquipo);

            clientes = [...clientes, ...clientesPorEquipo];
            console.log('Estado actual de Clientes después de propagación desde EquipoAVL:', clientes);
        }

        // === Propagación desde Movil ===
        if (moviles.length > 0) {
            console.log('\n=== PROPAGACIÓN DESDE MOVILES ===');
            const clienteNames = moviles.map((movil) => movil.Cliente).filter(Boolean);
            console.log('Clientes extraídos de Móviles:', clienteNames);

            const clientesPorMovil = await Cliente.find({
                Cliente: { $in: clienteNames },
            }).lean();
            console.log('Clientes encontrados por móviles:', clientesPorMovil);

            clientes = [...clientes, ...clientesPorMovil];
            console.log('Estado actual de Clientes después de propagación desde Móviles:', clientes);

            const equipoIds = moviles
                .map((movil) => extractEquipoPrinc(movil['Equipo Princ']))
                .filter((id) => id !== null);
            console.log('IDs de equipos extraídos de Móviles:', equipoIds);

            const equiposPorMovil = await EquipoAVL.find({
                ID: { $in: equipoIds },
            }).lean();
            console.log('Equipos encontrados por IDs de Móviles:', equiposPorMovil);

            equipos = [...equipos, ...equiposPorMovil];
            console.log('Estado actual de Equipos después de propagación desde Móviles:', equipos);
        }

        // === Propagación desde Cliente ===
        if (clientes.length > 0) {
            console.log('\n=== PROPAGACIÓN DESDE CLIENTES ===');
            const clienteNames = clientes.map((c) => c.Cliente).filter(Boolean);
            console.log('Nombres de clientes para búsqueda en Móviles:', clienteNames);

            const movilesPorCliente = await Movil.find({
                Cliente: { $in: clienteNames },
            }).lean();
            console.log('Móviles encontrados por clientes:', movilesPorCliente);

            moviles = [...moviles, ...movilesPorCliente];
            console.log('Estado actual de Móviles después de propagación desde Clientes:', moviles);

            const equipoIds = movilesPorCliente
                .map((movil) => extractEquipoPrinc(movil['Equipo Princ']))
                .filter((id) => id !== null);
            console.log('IDs de equipos extraídos de Móviles:', equipoIds);

            const equiposPorCliente = await EquipoAVL.find({
                ID: { $in: equipoIds },
            }).lean();
            console.log('Equipos encontrados por IDs de Móviles:', equiposPorCliente);

            equipos = [...equipos, ...equiposPorCliente];
            console.log('Estado actual de Equipos después de propagación desde Clientes:', equipos);
        }

        // Eliminar duplicados
        clientes = Array.from(new Set(clientes.map((c) => JSON.stringify(c)))).map((c) =>
            JSON.parse(c)
        );
        moviles = Array.from(new Set(moviles.map((m) => JSON.stringify(m)))).map((m) =>
            JSON.parse(m)
        );
        equipos = Array.from(new Set(equipos.map((e) => JSON.stringify(e)))).map((e) =>
            JSON.parse(e)
        );

        console.log('\n=== RESULTADOS FINALES ===');
        console.log(`Clientes: ${clientes.length}`);
        console.log(`Móviles: ${moviles.length}`);
        console.log(`Equipos: ${equipos.length}`);

        res.json({ Cliente: clientes, Movil: moviles, EquipoAVL: equipos });
    } catch (error) {
        console.error('\n=== ERROR EN LA BÚSQUEDA ===');
        console.error('Error completo:', error);
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

