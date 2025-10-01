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

function normalizarEquipoPrinc(valor) {
  // Acepta: 123, "123", { ID: 123 }, { "": 123 }
  if (valor === undefined) return undefined;
  if (valor === null || valor === '') return null;

  let n;
  if (typeof valor === 'object') n = Number(valor.ID ?? valor[''] ?? valor);
  else n = Number(valor);

  return Number.isFinite(n) ? { '': n } : valor;
}

function elegirModelo(type, models) {
  const mapa = {
    Cliente: models.Cliente,
    Movil: models.Movil,
    EquipoAVL: models.EquipoAVL,
    Simcard: models.Simcard,
  };
  return mapa[type] || null;
}

// ========= Handlers =========

exports.searchData = async (req, res) => {
  const { Cliente, Movil, EquipoAVL, Simcard } = req.models;
  const { cliente, movil, equipo, simcard } = req.query;
  const { bsonToJsonSafe } = require('../utils/bsonSafe');

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

    let simcardQuery = {};
    if (simcard) {
      const simcardRegExp = new RegExp(simcard, 'i');
      simcardQuery.$or = [
        { operador: simcardRegExp },
        { portador: simcardRegExp }
      ];
      if (!isNaN(Number(simcard))) {
        simcardQuery.$or.push({ ICCID: simcard });
        simcardQuery.$or.push({ fono: Number(simcard) });
      }
    }

    if (equipos.length > 0) {
      const equipoIds = equipos.map((e) => e.ID);
      simcardQuery.ID = { $in: equipoIds };
    }

    if (
      (simcardQuery.$or && simcardQuery.$or.length > 0) ||
      simcardQuery.ID
    ) {
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

    console.log('\n=== RESULTADOS FINALES ===');
    console.log(`Clientes: ${clientes.length}, Móviles: ${moviles.length}, Equipos: ${equipos.length}, Simcards: ${simcards.length}`);

    res.json(bsonToJsonSafe({
      Cliente: clientes,
      Movil: moviles,
      EquipoAVL: equipos,
      Simcard: simcards,
    }));
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
  const { Cliente, Movil, EquipoAVL } = req.models;
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

exports.exportTodo = async (req, res) => {
  const { Cliente, Movil, EquipoAVL, Simcard } = req.models;
  const clientes = await Cliente.find().lean();
  const moviles  = await Movil.find().lean();
  const equipos  = await EquipoAVL.find().lean();
  const simcards = await Simcard.find().lean();
  res.json(bsonToJsonSafe({ clientes, moviles, equipos, simcards }));
};

exports.createCliente = async (req, res) => {
  const { Cliente } = req.models;
  try {
    req.body.RUT = formatearRut(req.body.RUT);
    const existing = await Cliente.findOne({ RUT: req.body.RUT });
    if (existing) {
      return res.status(400).json({ message: 'Cliente con este RUT ya existe.' });
    }
    const cliente = new Cliente(req.body);
    const savedCliente = await cliente.save();
    res.status(201).json(bsonToJsonSafe(savedCliente));
  } catch (error) {
    console.error('Error al crear Cliente:', error);
    res.status(500).json({ message: 'Error al crear Cliente', error: error.message });
  }
};

exports.createMovil = async (req, res) => {
  const { Movil } = req.models;
  try {
    const existing = await Movil.findOne({ Patente: req.body.Patente });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un móvil con esta patente.' });
    }
    const movil = new Movil(req.body);
    const savedMovil = await movil.save();
    res.status(201).json(bsonToJsonSafe(savedMovil));
  } catch (error) {
    console.error('Error al crear Movil:', error);
    res.status(500).json({ message: 'Error al crear Movil', error: error.message });
  }
};

exports.createEquipoAVL = async (req, res) => {
  const { EquipoAVL } = req.models;
  try {
    const existing = await EquipoAVL.findOne({ ID: req.body.ID });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un equipo con este ID.' });
    }
    const equipo = new EquipoAVL(req.body);
    const savedEquipo = await equipo.save();
    res.status(201).json(bsonToJsonSafe(savedEquipo));
  } catch (error) {
    console.error('Error al crear EquipoAVL:', error);
    res.status(500).json({ message: 'Error al crear EquipoAVL', error: error.message });
  }
};

exports.createSimcard = async (req, res) => {
  const { Simcard } = req.models;
  try {
    const existing = await Simcard.findOne({ fono: req.body.fono });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe una simcard con este número.' });
    }
    const simcard = new Simcard(req.body);
    const savedSimcard = await simcard.save();
    res.status(201).json(bsonToJsonSafe(savedSimcard));
  } catch (error) {
    console.error('Error al crear Simcard:', error);
    res.status(500).json({ message: 'Error al crear Simcard', error: error.message });
  }
};

exports.getHistorial = async (req, res) => {
  const { Movil, Simcard } = req.models;
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

    res.json(bsonToJsonSafe(historial));
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error al obtener historial' });
  }
};

// ========= UPDATE =========
exports.updateDocumento = async (req, res) => {
  try {
    const { type, data } = req.body;
    if (!type || !data || !data._id) {
      return res.status(400).json({ message: 'Faltan datos para actualizar' });
    }

    const { Cliente, Movil, EquipoAVL, Simcard, HistorialCambio } = req.models;
    const peer = req.peerModels; // modelos del otro módulo (para mover cuando aplique)

    // Normalizaciones previas
    if (type === 'Movil') {
      if (data["Equipo Princ"] && typeof data["Equipo Princ"] === "string" && !isNaN(data["Equipo Princ"])) {
        data["Equipo Princ"] = { "": Number(data["Equipo Princ"]) };
      }
      if (typeof data["Equipo Princ"] === "number") {
        data["Equipo Princ"] = { "": data["Equipo Princ"] };
      }
    }
    if (type === 'Cliente' && data["CONDICION \nCLIENTE"]) {
      data["CONDICION \nCLIENTE"] = String(data["CONDICION \nCLIENTE"]).toUpperCase();
    }
    if (type === 'Movil' && data['CONDICION \nMOVIL']) {
      data['CONDICION \nMOVIL'] = String(data['CONDICION \nMOVIL']).toUpperCase();
    }

    // Selección de modelo
    let Modelo;
    if (type === 'Cliente') Modelo = Cliente;
    else if (type === 'Movil') Modelo = Movil;
    else if (type === 'EquipoAVL') Modelo = EquipoAVL;
    else if (type === 'Simcard') Modelo = Simcard;
    else return res.status(400).json({ message: 'Tipo no válido' });

    const prevDoc = await Modelo.findById(data._id).lean();
    if (!prevDoc) return res.status(404).json({ message: 'Documento no encontrado' });

    // Actualiza el doc principal
    await Modelo.updateOne({ _id: data._id }, data);
    const newDoc = await Modelo.findById(data._id).lean();

    // Log de cambios
    try {
      if (HistorialCambio && req.user) {
        const cambios = [];
        Object.keys(data).forEach((k) => {
          if (JSON.stringify(prevDoc[k]) !== JSON.stringify(newDoc[k])) {
            cambios.push({ campo: k, valorAnterior: prevDoc[k], valorNuevo: newDoc[k] });
          }
        });
        if (cambios.length) {
          await HistorialCambio.create({
            entidad: type,
            entidadId: data._id,
            usuario: {
              id: req.user._id, nombre: req.user.nombre, email: req.user.email, rol: req.user.rol
            },
            fecha: new Date(),
            cambios
          });
        }
      }
    } catch (e) {
      console.warn('No se pudo registrar HistorialCambio:', e.message);
    }

    // --------- CASCADA “RETIRADO” PARA CLIENTE ----------
    const becameRetirado =
      type === 'Cliente' &&
      (newDoc["CONDICION \nCLIENTE"] || '').toString().toUpperCase() === 'RETIRADO' &&
      (prevDoc["CONDICION \nCLIENTE"] || '').toString().toUpperCase() !== 'RETIRADO';

    let movedToHistorico = false;
    let afectados = { movilesActualizados: 0, movilesMovidos: 0 };

    if (becameRetirado) {
      // 1) Poner todos los móviles del cliente en RETIRADO y mover “Equipo Princ” -> “Equipo anterior”
      const movilesCliente = await Movil.find({ Cliente: prevDoc.Cliente }).lean();

      if (movilesCliente.length) {
        const ops = movilesCliente.map(m => {
          const equipoPrinc = m['Equipo Princ'] ?? null;
          return {
            updateOne: {
              filter: { _id: m._id },
              update: {
                $set: {
                  'CONDICION \nMOVIL': 'RETIRADO',
                  ...(equipoPrinc ? { 'Equipo anterior': equipoPrinc } : {})
                },
                $unset: { 'Equipo Princ': "" } // desvincular
              }
            }
          };
        });
        const bw = await Movil.bulkWrite(ops);
        afectados.movilesActualizados = bw.modifiedCount || movilesCliente.length;
      }

      // 2) Si la petición viene a /api/actual -> mover Cliente + Móviles a base “Histórico”
      const isActual = (req.baseUrl || '').includes('/api/actual');
      if (isActual && peer) {
        const { Cliente: HCliente, Movil: HMovil } = peer;

        // Copiar cliente al histórico (sin _id)
        const { _id: _c, __v: _vC, createdAt: _caC, updatedAt: _uaC, ...clientePlano } = newDoc;
        // upsert por RUT o por nombre de cliente, lo que tengas más estable
        const filtroCliente = newDoc.RUT ? { RUT: newDoc.RUT } : { Cliente: newDoc.Cliente };
        await HCliente.updateOne(filtroCliente, clientePlano, { upsert: true });

        // Traer los móviles ya actualizados (RETIRADO) y copiarlos
        const movs = await Movil.find({ Cliente: prevDoc.Cliente }).lean();
        if (movs.length) {
          const movsPlano = movs.map(({ _id, __v, createdAt, updatedAt, ...rest }) => rest);
          if (movsPlano.length) {
            await HMovil.insertMany(movsPlano);
            afectados.movilesMovidos = movsPlano.length;
          }
        }

        // Borrar de la base ACTUAL
        await Movil.deleteMany({ Cliente: prevDoc.Cliente });
        await Modelo.deleteOne({ _id: newDoc._id });

        movedToHistorico = true;
      }
    }

    return res.json(bsonToJsonSafe({
      message: movedToHistorico
        ? 'Cliente retirado, móviles actualizados y documentos movidos a Histórico.'
        : 'Documento actualizado correctamente',
      movedToHistorico,
      afectados
    }));
  } catch (error) {
    console.error('Error en updateDocumento:', error);
    return res.status(500).json({ message: 'Error al actualizar', error: error.message });
  }
};

exports.deleteDocumento = async (req, res) => {
  const { Cliente, Movil, EquipoAVL, Simcard } = req.models;
  const { tipo, id } = req.params;

  let Modelo;
  switch ((tipo || '').toLowerCase()) {
    case 'cliente':
      Modelo = Cliente; break;
    case 'movil':
      Modelo = Movil; break;
    case 'equipoavl':
      Modelo = EquipoAVL; break;
    case 'simcard':
      Modelo = Simcard; break;
    default:
      return res.status(400).json({ message: 'Tipo de documento no válido.' });
  }

  try {
    const doc = await Modelo.findById(id);
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado.' });

    await doc.deleteOne();
    res.json({ message: 'Documento eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar documento:', err);
    res.status(500).json({ message: 'Error al eliminar documento', error: err.message });
  }
};

function toNumberSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function buildEquipoPrincQueryById(equipoId) {
  // Soporta 'Equipo Princ' como número o como objeto { "": ID } o { ID: ID }
  return {
    $or: [
      { 'Equipo Princ': equipoId },
      { 'Equipo Princ': { '': equipoId } },
      { 'Equipo Princ.ID': equipoId },
    ]
  };
}

exports.inventoryEquipos = async (req, res) => {
  try {
    const { EquipoAVL, Movil } = req.models;
    const search = (req.query.search || '').trim();
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip  = (page - 1) * limit;

    const q = {};
    if (search) {
      const asNum = toNumberSafe(search);
      q.$or = [
        { imei:  new RegExp(search, 'i') },
        { serial:new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
      ];
      if (asNum !== null) q.$or.push({ ID: asNum });
    }

    const [total, rows] = await Promise.all([
      EquipoAVL.countDocuments(q),
      EquipoAVL.find(q).sort({ updatedAt: -1, ID: 1 }).skip(skip).limit(limit).lean()
    ]);

    // Marcar si el equipo está asignado (buscar un móvil que lo tenga como principal)
    const items = await Promise.all(rows.map(async (e) => {
      const m = await Movil.findOne(buildEquipoPrincQueryById(e.ID), { Patente: 1, Cliente: 1 }).lean();
      return {
        ...e,
        asignadoA: m ? { Patente: m.Patente, Cliente: m.Cliente } : null
      };
    }));

    res.json(bsonToJsonSafe({ items, page, limit, total, pages: Math.ceil(total / limit) }));
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener inventario de equipos', error: err.message });
  }
};

/**
 * GET /inventario/simcards?search=&page=1&limit=20
 */
exports.inventorySimcards = async (req, res) => {
  try {
    const { Simcard, EquipoAVL } = req.models;
    const search = (req.query.search || '').trim();
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip  = (page - 1) * limit;

    const q = {};
    if (search) {
      const asNum = toNumberSafe(search);
      q.$or = [
        { operador: new RegExp(search, 'i') },
        { portador: new RegExp(search, 'i') },
        { ICCID:    new RegExp(search, 'i') },
      ];
      if (asNum !== null) {
        q.$or.push({ fono: asNum });
        q.$or.push({ ID: asNum });
      }
    }

    const [total, rows] = await Promise.all([
      Simcard.countDocuments(q),
      Simcard.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean()
    ]);

    const items = await Promise.all(rows.map(async (s) => {
      const eq = s.ID ? await EquipoAVL.findOne({ ID: s.ID }, { ID: 1 }).lean() : null;
      return {
        ...s,
        asignadoA: eq ? { ID: eq.ID } : null
      };
    }));

    res.json(bsonToJsonSafe({ items, page, limit, total, pages: Math.ceil(total / limit) }));
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener inventario de simcards', error: err.message });
  }
};

/**
 * POST /inventario/asignar-equipo  { equipoId:number, patente:string }
 */
exports.assignEquipoToMovil = async (req, res) => {
  try {
    const { EquipoAVL, Movil } = req.models;
    const equipoId = toNumberSafe(req.body.equipoId);
    const patente  = (req.body.patente || '').trim();

    if (equipoId === null || !patente) {
      return res.status(400).json({ message: 'equipoId y patente son obligatorios' });
    }

    const equipo = await EquipoAVL.findOne({ ID: equipoId }).lean();
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });

    const yaAsignado = await Movil.findOne(buildEquipoPrincQueryById(equipoId), { Patente: 1 }).lean();
    if (yaAsignado) {
      return res.status(400).json({ message: `El equipo ${equipoId} ya está asignado al móvil ${yaAsignado.Patente}`});
    }

    const movil = await Movil.findOne({ Patente: new RegExp(`^${patente}$`, 'i') });
    if (!movil) return res.status(404).json({ message: `No existe móvil con patente ${patente}` });

    // Asignamos como objeto { "": ID } (formato que ya usas)
    movil['Equipo Princ'] = { '': equipoId };
    await movil.save();

    res.json(bsonToJsonSafe({ message: 'Equipo asignado correctamente', movilId: movil._id, patente: movil.Patente, equipoId }));
  } catch (err) {
    res.status(500).json({ message: 'Error al asignar equipo a móvil', error: err.message });
  }
};

/**
 * POST /inventario/asignar-simcard  { iccid:string, equipoId:number }
 */
exports.assignSimcardToEquipo = async (req, res) => {
  try {
    const { Simcard, EquipoAVL } = req.models;
    const iccid    = (req.body.iccid || '').trim();
    const equipoId = toNumberSafe(req.body.equipoId);

    if (!iccid || equipoId === null) {
      return res.status(400).json({ message: 'iccid y equipoId son obligatorios' });
    }

    const sim = await Simcard.findOne({ ICCID: iccid });
    if (!sim) return res.status(404).json({ message: 'Simcard no encontrada' });

    const equipo = await EquipoAVL.findOne({ ID: equipoId }).lean();
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });

    sim.ID = equipoId;
    await sim.save();

    res.json(bsonToJsonSafe({ message: 'Simcard asignada correctamente', iccid, equipoId }));
  } catch (err) {
    res.status(500).json({ message: 'Error al asignar simcard a equipo', error: err.message });
  }
};