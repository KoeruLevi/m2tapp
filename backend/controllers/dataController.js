const Cliente = require('../models/Cliente');
const EquipoAVL = require('../models/EquipoAVL');
const Movil = require('../models/Movil');
const Simcard = require('../models/Simcard');

function formatearRut(rutInput) {
    if (!rutInput) return '';
    let cleanRut = rutInput.replace(/[^0-9kK]/g, '').toUpperCase();
    let cuerpo = cleanRut.slice(0, -1);
    let dv = cleanRut.slice(-1);
    if (cuerpo.length < 7) return cleanRut;
    let rutFormateado = '';
    let i = 0;
    for (let j = cuerpo.length - 1; j >= 0; j--) {
        rutFormateado = cuerpo[j] + rutFormateado;
        i++;
        if (i % 3 === 0 && j !== 0) rutFormateado = '.' + rutFormateado;
    }
    return `${rutFormateado}-${dv}`;
}

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

        if (clienteFilter) {
            clientes = await Cliente.find({
                $or: [
                    { Cliente: clienteFilter },
                    { 'Razon Social': clienteFilter },
                    { RUT: clienteFilter },
                ],
            }).lean();
        }

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

            if (!clienteFilter && moviles.length > 0) {
                const clienteNames = [...new Set(moviles.map((m) => m.Cliente))];
                clientes = await Cliente.find({ Cliente: { $in: clienteNames } }).lean();
            }
        }

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

            if (!clienteFilter && moviles.length > 0) {
                const clienteNames = [...new Set(moviles.map((m) => m.Cliente))];
                clientes = await Cliente.find({ Cliente: { $in: clienteNames } }).lean();
            }
        }

        if (moviles.length > 0) {
            const equipoIds = moviles
                .map(movil => {
                    const equipoPrinc = movil["Equipo Princ"];
                    if (typeof equipoPrinc === "number") return equipoPrinc;
                    if (typeof equipoPrinc === "object" && equipoPrinc !== null) {
                        return equipoPrinc[""] || equipoPrinc.ID || null;
                    }
                    return null;
                })
                .filter(id => id && !isNaN(id));
        
            if (equipoIds.length > 0) {
                equipos = await EquipoAVL.find({ ID: { $in: equipoIds } }).lean();
            }
        }

        if (equipoFilter || moviles.length > 0) {
            let equipoQuery = {};
        
            if (equipoFilter) {
                if (!isNaN(equipoFilter)) {
                    equipoQuery.ID = Number(equipoFilter);
                } else {
                    equipoQuery.$or = [
                        { imei: new RegExp(equipoFilter, 'i') },
                        { serial: new RegExp(equipoFilter, 'i') },
                        { model: new RegExp(equipoFilter, 'i') },
                    ];
                }
            }
        
            const equipoIdsFromMoviles = moviles
                .map((m) => m['Equipo Princ'])
                .filter((e) => e && typeof e === 'object' && e[''])
                .map((e) => e['']);
        
            if (equipoIdsFromMoviles.length > 0) {
                equipoQuery = {
                    $or: [
                        ...(equipoQuery.$or || []),
                        { ID: { $in: equipoIdsFromMoviles } }
                    ]
                };
            }
        
            equipos = await EquipoAVL.find(equipoQuery).lean();
        }

            if (simcardFilter || equipos.length > 0) {
                const simcardQuery = {};

            if (simcardFilter) {
                const simcardNum = Number(simcard);
                const isNum = !isNaN(simcardNum);
            simcardQuery.$or = [
                { ICCID: simcardFilter },
                { operador: simcardFilter },
                { portador: simcardFilter },
                ...(isNum ? [{ fono: simcardNum }] : [])
            ];
                }

            if (equipos.length > 0) {
                const equipoIds = equipos.map((e) => e.ID);
                simcardQuery.ID = { $in: equipoIds };
            }
            console.log('Simcard Query:', JSON.stringify(simcardQuery));
            simcards = await Simcard.find(simcardQuery).lean();
            }

        if (!moviles.length && equipos.length > 0) {
            const equipoIds = equipos.map(e => e.ID);
            const movilesRelacionados = await Movil.find({
                'Equipo Princ': { $in: equipoIds.map(id => ({ '': id })) }
            }).lean();

            moviles = [...moviles, ...movilesRelacionados];
        }

        if (!clientes.length && moviles.length > 0) {
            const clienteNames = [...new Set(moviles.map(m => m.Cliente))];
            clientes = await Cliente.find({ Cliente: { $in: clienteNames } }).lean();
        }

        if (equipos.length > 0) {
            const equipoIds = equipos.map(e => e.ID);
            simcards = await Simcard.find({ ID: { $in: equipoIds } }).lean();
        }

        if (simcardFilter) {
            simcards = simcards.filter(sc => simcardFilter.test(sc.ICCID));
        }

        clientes = clientes.filter((cliente, index, self) =>
            index === self.findIndex((c) => c._id.toString() === cliente._id.toString())
        );

        equipos = equipos.filter((equipo, index, self) =>
            index === self.findIndex((e) => e.ID === equipo.ID)
        );

        simcards = simcards.filter((simcard, index, self) =>
            index === self.findIndex((s) => s.ICCID === simcard.ICCID)
        );

        if (clienteFilter && equipoFilter && !isNaN(equipoFilter)) {
            const equipoId = Number(equipoFilter);
            moviles = moviles.filter(movil => {
                const equipoPrinc = movil['Equipo Princ'];
                if (typeof equipoPrinc === 'number') return equipoPrinc === equipoId;
                if (typeof equipoPrinc === 'object' && equipoPrinc !== null) {
                    return equipoPrinc[''] === equipoId || equipoPrinc.ID === equipoId;
                }
                return false;
            });

            if (moviles.length > 0) {
                const clienteNames = [...new Set(moviles.map((m) => m.Cliente))];
                clientes = clientes.filter((c) => clienteNames.includes(c.Cliente));
            } else {
                clientes = [];
            }
        }

        if (moviles.length > 0) {
            const equipoIds = moviles
                .map((movil) => {
                    const equipoPrinc = movil["Equipo Princ"];
                    if (typeof equipoPrinc === "number") return equipoPrinc;
                    if (typeof equipoPrinc === "object" && equipoPrinc !== null) {
                        return equipoPrinc[""] || equipoPrinc.ID || null;
                    }
                    return null;
                })
                .filter((id) => id && !isNaN(id));

            if (equipoIds.length > 0) {
                equipos = await EquipoAVL.find({ ID: { $in: equipoIds } }).lean();
            } else {
                equipos = [];
            }
        }

        if (equipos.length > 0) {
            const equipoIds = equipos.map((e) => e.ID);
            simcards = await Simcard.find({ ID: { $in: equipoIds } }).lean();
        } else {
            simcards = [];
        }

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

exports.getSuggestions = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'El término de búsqueda es obligatorio' });
    }

    try {
        const regex = new RegExp(query, 'i');
        const suggestions = new Set();

        const clientes = await Cliente.find({
            $or: [
                { Cliente: regex },
                { "Razon Social": regex },
                { RUT: regex }
            ]
        });
        clientes.forEach(c => suggestions.add(c.Cliente).add(c["Razon Social"]).add(c.RUT));

        const moviles = await Movil.find({
            $or: [
                { Cliente: regex },
                { Marca: regex },
                { Patente: regex }
            ]
        });
        moviles.forEach(m => suggestions.add(m.Cliente).add(m.Marca).add(m.Patente));

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

exports.createCliente = async (req, res) => {
    try {
        req.body.RUT = formatearRut(req.body.RUT);
        const existing = await Cliente.findOne({ RUT: req.body.RUT });
        if (existing) {
            return res.status(400).json({ message: 'Cliente con este RUT ya existe.' });
        }
        const cliente = new Cliente(req.body);
        const savedCliente = await cliente.save();
        res.status(201).json(savedCliente);
    } catch (error) {
        console.error('Error al crear Cliente:', error);
        res.status(500).json({ message: 'Error al crear Cliente', error: error.message });
    }
};

exports.createMovil = async (req, res) => {
    try {
        const existing = await Movil.findOne({ Patente: req.body.Patente });
        if (existing) {
            return res.status(400).json({ message: 'Ya existe un móvil con esta patente.' });
        }

        const movil = new Movil(req.body);
        const savedMovil = await movil.save();
        res.status(201).json(savedMovil);
    } catch (error) {
        console.error('Error al crear Movil:', error);
        res.status(500).json({ message: 'Error al crear Movil', error: error.message });
    }
};

exports.createEquipoAVL = async (req, res) => {
    try {
        const existing = await EquipoAVL.findOne({ ID: req.body.ID });
        if (existing) {
            return res.status(400).json({ message: 'Ya existe un equipo con este ID.' });
        }

        const equipo = new EquipoAVL(req.body);
        const savedEquipo = await equipo.save();
        res.status(201).json(savedEquipo);
    } catch (error) {
        console.error('Error al crear EquipoAVL:', error);
        res.status(500).json({ message: 'Error al crear EquipoAVL', error: error.message });
    }
};

exports.createSimcard = async (req, res) => {
    try {
        const existing = await Simcard.findOne({ fono: req.body.fono });
        if (existing) {
            return res.status(400).json({ message: 'Ya existe una simcard con este número.' });
        }

        const simcard = new Simcard(req.body);
        const savedSimcard = await simcard.save();
        res.status(201).json(savedSimcard);
    } catch (error) {
        console.error('Error al crear Simcard:', error);
        res.status(500).json({ message: 'Error al crear Simcard', error: error.message });
    }
};

exports.getHistorial = async (req, res) => {
    const { type, id } = req.query;

    try {
        let historial = [];

        if (type === 'Movil') {
            historial = await Movil.find({ Patente: id }).sort({ updatedAt: -1 }).lean();
        } else if (type === 'Cliente') {
            historial = await Movil.find({ Cliente: id }).sort({ updatedAt: -1 }).lean();
        } else if (type === 'EquipoAVL') {
            historial = await Movil.find({ 
                $or: [
                    { 'Equipo Princ': id },
                    { 'Equipo Princ.ID': id },
                    { 'Equipo Princ.': id }
                ]
            }).sort({ updatedAt: -1 }).lean();
        } else if (type === 'Simcard') {
            historial = await Simcard.find({ ICCID: id }).sort({ updatedAt: -1 }).lean();
        }

        res.json(historial);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error al obtener historial' });
    }
};