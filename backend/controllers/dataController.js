const Clientes = require('../models/Cliente');
const Moviles = require('../models/Movil');
const EquiposAVL = require('../models/EquipoAVL');
const Simcards = require('../models/Simcard');

exports.searchData = async (req, res) => {
    try {
        const { query } = req.query;
        const regex = new RegExp(query, 'i'); // Búsqueda insensible a mayúsculas

        const resultados = {
            Simcard: [],
            EquipoAVL: [],
            Movil: [],
            Cliente: [],
        };

        // Buscar en Simcards
        const simcards = await Simcards.find({
            $or: [
                { ICCID: regex },
                { numeroTelefonico: regex },
                { operador: regex },
                { portador: regex },
                { estado: regex },
            ],
        });

        for (const sim of simcards) {
            const equipo = await EquiposAVL.findOne({ _id: sim.equipoAVL_id });
            const movil = equipo ? await Moviles.findOne({ _id: equipo.movil_id }) : null;
            const cliente = movil ? await Clientes.findOne({ _id: movil.cliente_id }) : null;

            resultados.Simcard.push(sim);
            if (equipo) resultados.EquipoAVL.push(equipo);
            if (movil) resultados.Movil.push(movil);
            if (cliente) resultados.Cliente.push(cliente);
        }

        // Buscar en EquiposAVL
        const equipos = await EquiposAVL.find({
            $or: [
                { IMEI: regex },
                { numeroSerie: regex },
                { firmware: regex },
                { fabricante: regex },
                { modelo: regex },
                { estado: regex },
            ],
        });

        for (const equipo of equipos) {
            const movil = await Moviles.findOne({ _id: equipo.movil_id });
            const cliente = movil ? await Clientes.findOne({ _id: movil.cliente_id }) : null;
            const sim = await Simcards.findOne({ _id: equipo.simcard_id });

            resultados.EquipoAVL.push(equipo);
            if (sim) resultados.Simcard.push(sim);
            if (movil) resultados.Movil.push(movil);
            if (cliente) resultados.Cliente.push(cliente);
        }

        // Buscar en Moviles
        const moviles = await Moviles.find({
            $or: [
                { condicion: regex },
                { tipo: regex },
                { marca: regex },
                { patente: regex },
                { mandante: regex },
                { descripcionInterna: regex },
            ],
        });

        for (const movil of moviles) {
            const cliente = await Clientes.findOne({ _id: movil.cliente_id });
            const equipoPrimario = await EquiposAVL.findOne({ _id: movil.equipoPrimario });
            const equipoSecundario = await EquiposAVL.findOne({ _id: movil.equipoSecundario });

            resultados.Movil.push(movil);
            if (cliente) resultados.Cliente.push(cliente);
            if (equipoPrimario) {
                resultados.EquipoAVL.push(equipoPrimario);
                const simPrimaria = await Simcards.findOne({ _id: equipoPrimario.simcard_id });
                if (simPrimaria) resultados.Simcard.push(simPrimaria);
            }
            if (equipoSecundario) {
                resultados.EquipoAVL.push(equipoSecundario);
                const simSecundaria = await Simcards.findOne({ _id: equipoSecundario.simcard_id });
                if (simSecundaria) resultados.Simcard.push(simSecundaria);
            }
        }

        // Buscar en Clientes
        const clientes = await Clientes.find({
            $or: [
                { nombre: regex },
                { razonSocial: regex },
                { RUT: regex },
                { domicilio: regex },
                { emails: regex },
            ],
        });

        for (const cliente of clientes) {
            const moviles = await Moviles.find({ cliente_id: cliente._id });

            resultados.Cliente.push(cliente);
            for (const movil of moviles) {
                const equipoPrimario = await EquiposAVL.findOne({ _id: movil.equipoPrimario });
                const equipoSecundario = await EquiposAVL.findOne({ _id: movil.equipoSecundario });

                resultados.Movil.push(movil);
                if (equipoPrimario) {
                    resultados.EquipoAVL.push(equipoPrimario);
                    const simPrimaria = await Simcards.findOne({ _id: equipoPrimario.simcard_id });
                    if (simPrimaria) resultados.Simcard.push(simPrimaria);
                }
                if (equipoSecundario) {
                    resultados.EquipoAVL.push(equipoSecundario);
                    const simSecundaria = await Simcards.findOne({ _id: equipoSecundario.simcard_id });
                    if (simSecundaria) resultados.Simcard.push(simSecundaria);
                }
            }
        }

        res.json(resultados);
    } catch (error) {
        console.error('Error al buscar datos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.getSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        const regex = new RegExp(query, 'i'); // Búsqueda insensible a mayúsculas

        const suggestions = new Set();

        // Buscar en Simcards
        const simcards = await Simcards.find({
            $or: [
                { ICCID: regex },
                { numeroTelefonico: regex },
                { operador: regex },
                { portador: regex },
                { estado: regex },
            ],
        });
        simcards.forEach((sim) => {
            suggestions.add(sim.ICCID);
            suggestions.add(sim.numeroTelefonico);
            suggestions.add(sim.operador);
            suggestions.add(sim.portador);
        });

        // Buscar en EquiposAVL
        const equipos = await EquiposAVL.find({
            $or: [
                { IMEI: regex },
                { numeroSerie: regex },
                { firmware: regex },
                { fabricante: regex },
                { modelo: regex },
                { estado: regex },
            ],
        });
        equipos.forEach((equipo) => {
            suggestions.add(equipo.IMEI);
            suggestions.add(equipo.numeroSerie);
            suggestions.add(equipo.fabricante);
            suggestions.add(equipo.modelo);
        });

        // Buscar en Moviles
        const moviles = await Moviles.find({
            $or: [
                { condicion: regex },
                { tipo: regex },
                { marca: regex },
                { patente: regex },
                { mandante: regex },
                { descripcionInterna: regex },
            ],
        });
        moviles.forEach((movil) => {
            suggestions.add(movil.tipo);
            suggestions.add(movil.marca);
            suggestions.add(movil.patente);
            suggestions.add(movil.mandante);
        });

        // Buscar en Clientes
        const clientes = await Clientes.find({
            $or: [
                { nombre: regex },
                { razonSocial: regex },
                { RUT: regex },
                { domicilio: regex },
                { emails: regex },
            ],
        });
        clientes.forEach((cliente) => {
            suggestions.add(cliente.nombre);
            suggestions.add(cliente.razonSocial);
            suggestions.add(cliente.RUT);
        });

        res.json([...suggestions]); // Convertimos el Set a un array
    } catch (error) {
        console.error('Error al obtener sugerencias:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};