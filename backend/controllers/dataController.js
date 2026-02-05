const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { bsonToJsonSafe } = require('../utils/bsonSafe');

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

// ==== helpers para diffs granulares ====
function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function normalizeUndef(v) {
  return v === undefined ? null : v;
}

// Genera cambios por subclave cuando before/after son objetos
function diffField(topKey, before, after) {
  const out = [];

  if (isPlainObject(before) && isPlainObject(after)) {
    const subkeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const sk of subkeys) {
      const b = before[sk];
      const a = after[sk];
      if (JSON.stringify(b) !== JSON.stringify(a)) {
        out.push({
          campo: topKey,
          valorAnterior: { [sk]: normalizeUndef(b) },
          valorNuevo: { [sk]: normalizeUndef(a) },
        });
      }
    }
    return out;
  }

  if (JSON.stringify(before) !== JSON.stringify(after)) {
    out.push({
      campo: topKey,
      valorAnterior: normalizeUndef(before),
      valorNuevo: normalizeUndef(after),
    });
  }
  return out;
}

function normalizarEquipoPrinc(valor) {
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

// ===== helpers carga masiva =====
function toBool(v) {
  if (v === true || v === false) return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'si' || s === 'sí' || s === 'yes' || s === 'x';
}

function toNumOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function applyHeaderAliases(tipo, r) {
  const out = { ...r };

  // Cliente
  if (tipo === 'cliente') {
    if (out['CONDICION CLIENTE'] != null && out['CONDICION \nCLIENTE'] == null) {
      out['CONDICION \nCLIENTE'] = out['CONDICION CLIENTE'];
    }
  }

  // Movil
  if (tipo === 'movil') {
    if (out['CONDICION MOVIL'] != null && out['CONDICION \nMOVIL'] == null) {
      out['CONDICION \nMOVIL'] = out['CONDICION MOVIL'];
    }
    if (out['ACTIVO EN TRASAT_1'] != null && out['ACTIVO EN \nTRASAT_1'] == null) {
      out['ACTIVO EN \nTRASAT_1'] = out['ACTIVO EN TRASAT_1'];
    }
    if (out['ACTIVO EN AKITA'] != null && out['ACTIVO EN \nAKITA'] == null) {
      out['ACTIVO EN \nAKITA'] = out['ACTIVO EN AKITA'];
    }
    if (out['ACTIVO EN Tgo'] != null && out['ACTIVO EN\nTgo'] == null) {
      out['ACTIVO EN\nTgo'] = out['ACTIVO EN Tgo'];
    }
    if (out['TECNOLOGIA EQUIPO'] != null && out['TECNOLOGIA \nEQUIPO'] == null) {
      out['TECNOLOGIA \nEQUIPO'] = out['TECNOLOGIA EQUIPO'];
    }
    if (out['Tecnico Instalador'] != null && out['Tecnico\nInstalador'] == null) {
      out['Tecnico\nInstalador'] = out['Tecnico Instalador'];
    }
  }

  return out;
}

function normalizeRow(tipo, row) {
  let r = applyHeaderAliases(tipo, row);

  if (tipo === 'cliente') {
    if (r.RUT) r.RUT = formatearRut(String(r.RUT));
    if (r['CONDICION \nCLIENTE']) r['CONDICION \nCLIENTE'] = String(r['CONDICION \nCLIENTE']).toUpperCase();
    else r['CONDICION \nCLIENTE'] = 'ACTIVO';
  }

  if (tipo === 'movil') {
    if (r.Patente != null) r.Patente = String(r.Patente).trim().toUpperCase();

    r.Suspendido = toBool(r.Suspendido);
    r['ACTIVO EN \nTRASAT_1'] = toBool(r['ACTIVO EN \nTRASAT_1']);
    r['ACTIVO EN \nAKITA'] = toBool(r['ACTIVO EN \nAKITA']);
    r['ACTIVO EN\nTgo'] = toBool(r['ACTIVO EN\nTgo']);

    const ep = r['Equipo Princ'];
    const epNum = ep != null && typeof ep === 'object' ? toNumOrNull(ep[''] ?? ep.ID) : toNumOrNull(ep);
    if (epNum !== null) r['Equipo Princ'] = { '': epNum };

    if (r['CONDICION \nMOVIL']) r['CONDICION \nMOVIL'] = String(r['CONDICION \nMOVIL']).toUpperCase();
  }

  if (tipo === 'equipoavl') {
    r.ID = toNumOrNull(r.ID);
    r.serial = toNumOrNull(r.serial);
  }

  if (tipo === 'simcard') {
    r.fono = toNumOrNull(r.fono);
    r.ID = toNumOrNull(r.ID);
    if (r.estado != null) r.estado = String(r.estado);
  }

  return r;
}

// ========= Handlers =========
exports.searchData = async (req, res) => {
  const { Cliente, Movil, EquipoAVL, Simcard } = req.models;

  const clienteRaw = (req.query.cliente || '').trim();
  const movilRaw = (req.query.movil || '').trim();
  const equipoRaw = (req.query.equipo || '').trim();
  const simcardRaw = (req.query.simcard || '').trim();

  const hasCliente = clienteRaw.length > 0;
  const hasMovil = movilRaw.length > 0;
  const hasEquipo = equipoRaw.length > 0;
  const hasSimcard = simcardRaw.length > 0;

  // Si vienen todos vacíos, no traigas toda la BD
  if (!hasCliente && !hasMovil && !hasEquipo && !hasSimcard) {
    return res.json(bsonToJsonSafe({ Cliente: [], Movil: [], EquipoAVL: [], Simcard: [] }));
  }

  const clienteRegex = hasCliente ? new RegExp(clienteRaw, 'i') : null;
  const movilRegex = hasMovil ? new RegExp(movilRaw, 'i') : null;
  const simRegex = hasSimcard ? new RegExp(simcardRaw, 'i') : null;

  const toNumberSafeLocal = (v) => {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const extractEquipoIdFromMovil = (m) => {
    const ep = m?.['Equipo Princ'];
    if (ep == null) return null;
    if (typeof ep === 'number') return ep;
    if (typeof ep === 'string') {
      const n = toNumberSafeLocal(ep);
      return n === null ? null : n;
    }
    if (typeof ep === 'object') {
      const n = toNumberSafeLocal(ep[''] ?? ep.ID);
      return n === null ? null : n;
    }
    return null;
  };

  // Query para Movil por IDs de equipo, soportando Equipo Princ como número o como objeto
  const buildMovilQueryByEquipoIds = (ids) => {
    const clean = (ids || []).map(toNumberSafeLocal).filter((n) => n !== null);
    if (!clean.length) return null;

    return {
      $or: [
        { 'Equipo Princ': { $in: clean } },                         // guardado como número
        { 'Equipo Princ': { $in: clean.map((id) => ({ '': id })) } }, // guardado como { "": id } (match por igualdad)
        { 'Equipo Princ.ID': { $in: clean } },                      // guardado como { ID: id }
      ],
    };
  };

  const dedupeByKey = (arr, keyFn) => {
    const map = new Map();
    for (const x of arr || []) {
      const k = keyFn(x);
      if (!k) continue;
      if (!map.has(k)) map.set(k, x);
    }
    return [...map.values()];
  };

  const intersectById = (arrays) => {
    if (!arrays.length) return [];

    const sets = arrays.map((a) => new Set((a || []).map((d) => d?._id?.toString()).filter(Boolean)));
    let inter = sets[0];
    for (let i = 1; i < sets.length; i++) {
      const s = sets[i];
      inter = new Set([...inter].filter((id) => s.has(id)));
      if (!inter.size) break;
    }
    if (!inter.size) return [];

    const idToDoc = new Map();
    for (const a of arrays) {
      for (const d of a || []) {
        const id = d?._id?.toString();
        if (id && inter.has(id) && !idToDoc.has(id)) idToDoc.set(id, d);
      }
    }
    return [...idToDoc.values()];
  };

  try {
    // 1) Seed por filtros directos
    let clientesByFilter = [];
    let equiposByFilter = [];
    let simcardsByFilter = [];
    let movilesA = []; // por (movil/cliente)
    let movilesB = []; // por equipo
    let movilesC = []; // por simcard

    if (hasCliente) {
      clientesByFilter = await Cliente.find({
        $or: [{ Cliente: clienteRegex }, { 'Razon Social': clienteRegex }, { RUT: clienteRegex }],
      }).lean();
    }

    if (hasMovil || hasCliente) {
      // Si hay clienteFilter pero no hay clientes, la intersección debe ser vacío
      if (hasCliente && clientesByFilter.length === 0) {
        movilesA = [];
      } else {
        const movilQuery = {
          ...(hasMovil && { $or: [{ Marca: movilRegex }, { Tipo: movilRegex }, { Patente: movilRegex }] }),
          ...(hasCliente && { Cliente: { $in: clientesByFilter.map((c) => c.Cliente) } }),
        };
        movilesA = await Movil.find(movilQuery).lean();
      }
    }

    if (hasEquipo) {
      // Heurística: si es numérico y corto -> ID; si es numérico largo -> IMEI/serial probablemente
      const isNumeric = !isNaN(equipoRaw);
      const looksLikeId = isNumeric && equipoRaw.length <= 7;

      const equipoQuery = looksLikeId
        ? { ID: Number(equipoRaw) }
        : {
            $or: [
              { imei: new RegExp(equipoRaw, 'i') },
              { model: new RegExp(equipoRaw, 'i') },
              // serial suele ser number, soporta match por igualdad si viene numérico
              ...(isNumeric ? [{ serial: Number(equipoRaw) }] : []),
            ],
          };

      equiposByFilter = await EquipoAVL.find(equipoQuery).lean();

      const eqIds = equiposByFilter.map((e) => toNumberSafeLocal(e.ID)).filter((n) => n !== null);
      const qMovB = buildMovilQueryByEquipoIds(eqIds);
      movilesB = qMovB ? await Movil.find(qMovB).lean() : [];
    }

    if (hasSimcard) {
      const simcardQuery = { $or: [{ operador: simRegex }, { portador: simRegex }, { ICCID: simRegex }] };

      const asNum = toNumberSafeLocal(simcardRaw);
      if (asNum !== null) {
        simcardQuery.$or.push({ fono: asNum });
        simcardQuery.$or.push({ ID: asNum }); // por si el usuario pega un ID de equipo aquí
      }

      simcardsByFilter = await Simcard.find(simcardQuery).lean();

      const simEqIds = dedupeByKey(
        simcardsByFilter
          .map((s) => toNumberSafeLocal(s.ID))
          .filter((n) => n !== null),
        (n) => String(n)
      );

      const qMovC = buildMovilQueryByEquipoIds(simEqIds);
      movilesC = qMovC ? await Movil.find(qMovC).lean() : [];
    }

    // 2) Construir móviles candidatos (intersección de filtros que apliquen)
    const movilSets = [];
    if (hasMovil || hasCliente) movilSets.push(movilesA);
    if (hasEquipo) movilSets.push(movilesB);
    if (hasSimcard) movilSets.push(movilesC);

    let moviles = intersectById(movilSets);
    moviles = dedupeByKey(moviles, (m) => m?._id?.toString());

    // 3) Si NO hay móviles, igual permite búsquedas solo Equipo/Simcard (relación directa)
    const onlyEquipoSim = !hasCliente && !hasMovil && (hasEquipo || hasSimcard);

    if (moviles.length === 0) {
      if (!onlyEquipoSim) {
        return res.json(bsonToJsonSafe({ Cliente: [], Movil: [], EquipoAVL: [], Simcard: [] }));
      }

      // Caso: solo equipo y/o simcard (sin móviles). Devuelve relación Equipo<->Simcard.
      let equipos = equiposByFilter;
      let simcards = simcardsByFilter;

      if (hasEquipo && !hasSimcard) {
        const eqIds = equipos.map((e) => toNumberSafeLocal(e.ID)).filter((n) => n !== null);
        simcards = eqIds.length ? await Simcard.find({ ID: { $in: eqIds } }).lean() : [];
      } else if (hasSimcard && !hasEquipo) {
        const simEqIds = dedupeByKey(
          simcards
            .map((s) => toNumberSafeLocal(s.ID))
            .filter((n) => n !== null),
          (n) => String(n)
        );
        equipos = simEqIds.length ? await EquipoAVL.find({ ID: { $in: simEqIds } }).lean() : [];
      } else if (hasEquipo && hasSimcard) {
        const eqSet = new Set(equiposByFilter.map((e) => toNumberSafeLocal(e.ID)).filter((n) => n !== null));
        simcards = simcardsByFilter.filter((s) => eqSet.has(toNumberSafeLocal(s.ID)));
        const interIds = dedupeByKey(
          simcards.map((s) => toNumberSafeLocal(s.ID)).filter((n) => n !== null),
          (n) => String(n)
        );
        equipos = interIds.length ? await EquipoAVL.find({ ID: { $in: interIds } }).lean() : [];
      }

      equipos = dedupeByKey(equipos, (e) => String(e.ID));
      simcards = dedupeByKey(simcards, (s) => String(s.ICCID ?? s._id));

      return res.json(bsonToJsonSafe({ Cliente: [], Movil: [], EquipoAVL: equipos, Simcard: simcards }));
    }

    // 4) Con móviles encontrados, derivar el resto en cadena
    const clienteNames = dedupeByKey(
      moviles.map((m) => m.Cliente).filter(Boolean),
      (x) => String(x)
    );

    const equipoIdsFromMoviles = dedupeByKey(
      moviles.map(extractEquipoIdFromMovil).filter((n) => n !== null),
      (n) => String(n)
    );

    let equipos = equipoIdsFromMoviles.length ? await EquipoAVL.find({ ID: { $in: equipoIdsFromMoviles } }).lean() : [];
    let simcards = equipoIdsFromMoviles.length ? await Simcard.find({ ID: { $in: equipoIdsFromMoviles } }).lean() : [];
    let clientes = clienteNames.length ? await Cliente.find({ Cliente: { $in: clienteNames } }).lean() : [];

    // 5) Aplicar restricciones finales si el filtro existía (intersección con seeds)
    if (hasCliente) {
      const idSet = new Set(clientesByFilter.map((c) => c._id.toString()));
      clientes = clientes.filter((c) => idSet.has(c._id.toString()));
    }

    if (hasEquipo) {
      const idSet = new Set(equiposByFilter.map((e) => String(e.ID)));
      equipos = equipos.filter((e) => idSet.has(String(e.ID)));
      // Si hay filtro equipo, también acota simcards a esos equipos
      const eqIds = equipos.map((e) => toNumberSafeLocal(e.ID)).filter((n) => n !== null);
      simcards = simcards.filter((s) => eqIds.includes(toNumberSafeLocal(s.ID)));
    }

    if (hasSimcard) {
      const idSet = new Set(simcardsByFilter.map((s) => s._id.toString()));
      simcards = simcards.filter((s) => idSet.has(s._id.toString()));
      // Si hay filtro simcard, acota equipos a los IDs de esas simcards
      const simEqIds = dedupeByKey(
        simcards.map((s) => toNumberSafeLocal(s.ID)).filter((n) => n !== null),
        (n) => String(n)
      );
      equipos = equipos.filter((e) => simEqIds.includes(toNumberSafeLocal(e.ID)));
    }

    // 6) Dedup final
    clientes = dedupeByKey(clientes, (c) => c?._id?.toString());
    moviles = dedupeByKey(moviles, (m) => m?._id?.toString());
    equipos = dedupeByKey(equipos, (e) => String(e.ID));
    simcards = dedupeByKey(simcards, (s) => String(s.ICCID ?? s._id));

    return res.json(
      bsonToJsonSafe({
        Cliente: clientes,
        Movil: moviles,
        EquipoAVL: equipos,
        Simcard: simcards,
      })
    );
  } catch (error) {
    console.error('Error en searchData:', error);
    return res.status(500).json({ message: 'Error al realizar la búsqueda', error: error.message });
  }
};

exports.getSuggestions = async (req, res) => {
  const { Cliente, Movil, EquipoAVL } = req.models;
  const { query } = req.query;

  if (!query) return res.status(400).json({ message: 'El término de búsqueda es obligatorio' });

  try {
    const regex = new RegExp(query, 'i');
    const suggestions = new Set();

    const clientes = await Cliente.find({
      $or: [{ Cliente: regex }, { 'Razon Social': regex }, { RUT: regex }],
    });
    clientes.forEach((c) => suggestions.add(c.Cliente).add(c['Razon Social']).add(c.RUT));

    const moviles = await Movil.find({
      $or: [{ Cliente: regex }, { Marca: regex }, { Patente: regex }],
    });
    moviles.forEach((m) => suggestions.add(m.Cliente).add(m.Marca).add(m.Patente));

    const equipos = await EquipoAVL.find({ $or: [{ imei: regex }, { serial: regex }] });
    equipos.forEach((e) => suggestions.add(e.imei));

    res.json([...suggestions]);
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.exportTodo = async (req, res) => {
  const { Cliente, Movil, EquipoAVL, Simcard } = req.models;
  const clientes = await Cliente.find().lean();
  const moviles = await Movil.find().lean();
  const equipos = await EquipoAVL.find().lean();
  const simcards = await Simcard.find().lean();
  res.json(bsonToJsonSafe({ clientes, moviles, equipos, simcards }));
};

exports.createCliente = async (req, res) => {
  const { Cliente } = req.models;
  try {
    req.body.RUT = formatearRut(req.body.RUT);
    const existing = await Cliente.findOne({ RUT: req.body.RUT });
    if (existing) return res.status(400).json({ message: 'Cliente con este RUT ya existe.' });

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
    if (existing) return res.status(400).json({ message: 'Ya existe un móvil con esta patente.' });

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
    if (existing) return res.status(400).json({ message: 'Ya existe un equipo con este ID.' });

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
    if (existing) return res.status(400).json({ message: 'Ya existe una simcard con este número.' });

    const simcard = new Simcard(req.body);
    const savedSimcard = await simcard.save();
    res.status(201).json(bsonToJsonSafe(savedSimcard));
  } catch (error) {
    console.error('Error al crear Simcard:', error);
    res.status(500).json({ message: 'Error al crear Simcard', error: error.message });
  }
};

// ===== CARGA MASIVA =====
exports.bulkImport = async (req, res) => {
  const file = req.file;
  const tipo = (req.params.tipo || '').toLowerCase();

  try {
    // Bloqueo si este router se monta bajo /api/historico
    if ((req.baseUrl || '').includes('/api/historico')) {
      return res.status(403).json({ message: 'El módulo Histórico no permite carga masiva.' });
    }

    if (!file) return res.status(400).json({ message: 'Falta archivo.' });

    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      return res.status(400).json({ message: 'Formato no válido. Usa .xlsx o .csv (UTF-8).' });
    }

    const { Cliente, Movil, EquipoAVL, Simcard } = req.models;

    let Modelo = null;
    let uniqueKey = null;
    let required = [];

    if (tipo === 'cliente') {
      Modelo = Cliente;
      uniqueKey = 'RUT';
      required = ['Cliente', 'RUT'];
    } else if (tipo === 'movil') {
      Modelo = Movil;
      uniqueKey = 'Patente';
      required = ['Patente', 'Cliente'];
    } else if (tipo === 'equipoavl') {
      Modelo = EquipoAVL;
      uniqueKey = 'ID';
      required = ['imei', 'model', 'serial', 'current_firmware', 'ID'];
    } else if (tipo === 'simcard') {
      Modelo = Simcard;
      uniqueKey = 'fono';
      required = ['ICCID', 'fono', 'operador', 'ID'];
    } else {
      return res.status(400).json({ message: 'Tipo inválido.' });
    }

    let wb;
    if (ext === '.csv') {
      const csvText = fs.readFileSync(file.path, 'utf8');
      wb = XLSX.read(csvText, { type: 'string' });
    } else {
      wb = XLSX.readFile(file.path, { cellDates: true });
    }

    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

    if (!rows.length) return res.status(400).json({ message: 'Archivo sin filas.' });
    if (rows.length > 5000) return res.status(400).json({ message: 'Máximo 5000 filas por carga.' });

    const invalid = [];
    const valid = [];

    rows.forEach((row, idx) => {
      const normalized = normalizeRow(tipo, row);

      const missing = required.filter((k) => normalized[k] == null || normalized[k] === '');
      if (missing.length) {
        invalid.push({ fila: idx + 2, motivo: `Faltan campos: ${missing.join(', ')}` });
        return;
      }

      valid.push(normalized);
    });

    // Deduplicar dentro del archivo
    const seen = new Set();
    const deduped = [];
    valid.forEach((r) => {
      const k = String(r[uniqueKey]).trim().toLowerCase();
      if (!k) return;
      if (seen.has(k)) return;
      seen.add(k);
      deduped.push(r);
    });

    // Filtrar duplicados existentes en BD
    const keys = deduped.map((r) => r[uniqueKey]).filter((v) => v != null);
    const existing = await Modelo.find({ [uniqueKey]: { $in: keys } }, { [uniqueKey]: 1 }).lean();
    const existingSet = new Set(existing.map((d) => String(d[uniqueKey]).trim().toLowerCase()));

    const toInsert = deduped.filter(
      (r) => !existingSet.has(String(r[uniqueKey]).trim().toLowerCase())
    );

    const inserted = toInsert.length ? await Modelo.insertMany(toInsert, { ordered: false }) : [];

    return res.json({
      tipo,
      total: rows.length,
      insertados: inserted.length,
      duplicadosBD: deduped.length - toInsert.length,
      invalidos: invalid.length,
      errores: invalid.slice(0, 50),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error en carga masiva.', error: err.message });
  } finally {
    if (file?.path) {
      try {
        fs.unlinkSync(file.path);
      } catch {}
    }
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
        $or: [{ 'Equipo Princ': id }, { 'Equipo Princ.ID': id }, { 'Equipo Princ.': id }],
      })
        .sort({ updatedAt: -1 })
        .lean();
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
    const peer = req.peerModels;

    if (type === 'Movil') {
      if (data['Equipo Princ'] && typeof data['Equipo Princ'] === 'string' && !isNaN(data['Equipo Princ'])) {
        data['Equipo Princ'] = { '': Number(data['Equipo Princ']) };
      }
      if (typeof data['Equipo Princ'] === 'number') {
        data['Equipo Princ'] = { '': data['Equipo Princ'] };
      }
    }
    if (type === 'Cliente' && data['CONDICION \nCLIENTE']) {
      data['CONDICION \nCLIENTE'] = String(data['CONDICION \nCLIENTE']).toUpperCase();
    }
    if (type === 'Movil' && data['CONDICION \nMOVIL']) {
      data['CONDICION \nMOVIL'] = String(data['CONDICION \nMOVIL']).toUpperCase();
    }

    let Modelo;
    if (type === 'Cliente') Modelo = Cliente;
    else if (type === 'Movil') Modelo = Movil;
    else if (type === 'EquipoAVL') Modelo = EquipoAVL;
    else if (type === 'Simcard') Modelo = Simcard;
    else return res.status(400).json({ message: 'Tipo no válido' });

    const prevDoc = await Modelo.findById(data._id).lean();
    if (!prevDoc) return res.status(404).json({ message: 'Documento no encontrado' });

    await Modelo.updateOne({ _id: data._id }, data);
    const newDoc = await Modelo.findById(data._id).lean();

    try {
      if (HistorialCambio && req.user) {
        const cambios = [];
        const touchedTop = new Set(Object.keys(data).map((k) => k.split('.')[0]));

        for (const k of touchedTop) {
          const before = prevDoc[k];
          const after = newDoc[k];
          cambios.push(...diffField(k, before, after));
        }

        if (cambios.length) {
          await HistorialCambio.create({
            entidad: type,
            entidadId: data._id,
            usuario: {
              id: req.user._id,
              nombre: req.user.nombre,
              email: req.user.email,
              rol: req.user.rol,
            },
            fecha: new Date(),
            cambios,
          });
        }
      }
    } catch (e) {
      console.warn('No se pudo registrar HistorialCambio:', e.message);
    }

    const becameRetirado =
      type === 'Cliente' &&
      (newDoc['CONDICION \nCLIENTE'] || '').toString().toUpperCase() === 'RETIRADO' &&
      (prevDoc['CONDICION \nCLIENTE'] || '').toString().toUpperCase() !== 'RETIRADO';

    let movedToHistorico = false;
    let afectados = { movilesActualizados: 0, movilesMovidos: 0 };

    if (becameRetirado) {
      const movilesCliente = await Movil.find({ Cliente: prevDoc.Cliente }).lean();

      if (movilesCliente.length) {
        const ops = movilesCliente.map((m) => {
          const equipoPrinc = m['Equipo Princ'] ?? null;
          return {
            updateOne: {
              filter: { _id: m._id },
              update: {
                $set: {
                  'CONDICION \nMOVIL': 'RETIRADO',
                  ...(equipoPrinc ? { 'Equipo anterior': equipoPrinc } : {}),
                },
                $unset: { 'Equipo Princ': '' },
              },
            },
          };
        });
        const bw = await Movil.bulkWrite(ops);
        afectados.movilesActualizados = bw.modifiedCount || movilesCliente.length;
      }

      const isActual = (req.baseUrl || '').includes('/api/actual');
      if (isActual && peer) {
        const { Cliente: HCliente, Movil: HMovil } = peer;

        const { _id: _c, __v: _vC, createdAt: _caC, updatedAt: _uaC, ...clientePlano } = newDoc;
        const filtroCliente = newDoc.RUT ? { RUT: newDoc.RUT } : { Cliente: newDoc.Cliente };
        await HCliente.updateOne(filtroCliente, clientePlano, { upsert: true });

        const movs = await Movil.find({ Cliente: prevDoc.Cliente }).lean();
        if (movs.length) {
          const movsPlano = movs.map(({ _id, __v, createdAt, updatedAt, ...rest }) => rest);
          if (movsPlano.length) {
            await HMovil.insertMany(movsPlano);
            afectados.movilesMovidos = movsPlano.length;
          }
        }

        await Movil.deleteMany({ Cliente: prevDoc.Cliente });
        await Modelo.deleteOne({ _id: newDoc._id });

        movedToHistorico = true;
      }
    }

    return res.json(
      bsonToJsonSafe({
        message: movedToHistorico
          ? 'Cliente retirado, móviles actualizados y documentos movidos a Histórico.'
          : 'Documento actualizado correctamente',
        movedToHistorico,
        afectados,
      })
    );
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
      Modelo = Cliente;
      break;
    case 'movil':
      Modelo = Movil;
      break;
    case 'equipoavl':
      Modelo = EquipoAVL;
      break;
    case 'simcard':
      Modelo = Simcard;
      break;
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
  return {
    $or: [{ 'Equipo Princ': equipoId }, { 'Equipo Princ': { '': equipoId } }, { 'Equipo Princ.ID': equipoId }],
  };
}

exports.inventoryEquipos = async (req, res) => {
  try {
    const { EquipoAVL, Movil } = req.models;
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const q = {};
    if (search) {
      const asNum = toNumberSafe(search);
      q.$or = [{ imei: new RegExp(search, 'i') }, { serial: new RegExp(search, 'i') }, { model: new RegExp(search, 'i') }];
      if (asNum !== null) q.$or.push({ ID: asNum });
    }

    const [total, rows] = await Promise.all([
      EquipoAVL.countDocuments(q),
      EquipoAVL.find(q).sort({ updatedAt: -1, ID: 1 }).skip(skip).limit(limit).lean(),
    ]);

    const items = await Promise.all(
      rows.map(async (e) => {
        const m = await Movil.findOne(buildEquipoPrincQueryById(e.ID), { Patente: 1, Cliente: 1 }).lean();
        return { ...e, asignadoA: m ? { Patente: m.Patente, Cliente: m.Cliente } : null };
      })
    );

    res.json(bsonToJsonSafe({ items, page, limit, total, pages: Math.ceil(total / limit) }));
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener inventario de equipos', error: err.message });
  }
};

exports.inventorySimcards = async (req, res) => {
  try {
    const { Simcard, EquipoAVL } = req.models;
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const q = {};
    if (search) {
      const asNum = toNumberSafe(search);
      q.$or = [{ operador: new RegExp(search, 'i') }, { portador: new RegExp(search, 'i') }, { ICCID: new RegExp(search, 'i') }];
      if (asNum !== null) {
        q.$or.push({ fono: asNum });
        q.$or.push({ ID: asNum });
      }
    }

    const [total, rows] = await Promise.all([
      Simcard.countDocuments(q),
      Simcard.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const items = await Promise.all(
      rows.map(async (s) => {
        const eq = s.ID ? await EquipoAVL.findOne({ ID: s.ID }, { ID: 1 }).lean() : null;
        return { ...s, asignadoA: eq ? { ID: eq.ID } : null };
      })
    );

    res.json(bsonToJsonSafe({ items, page, limit, total, pages: Math.ceil(total / limit) }));
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener inventario de simcards', error: err.message });
  }
};

exports.assignEquipoToMovil = async (req, res) => {
  try {
    const { EquipoAVL, Movil } = req.models;
    const equipoId = toNumberSafe(req.body.equipoId);
    const patente = (req.body.patente || '').trim();

    if (equipoId === null || !patente) return res.status(400).json({ message: 'equipoId y patente son obligatorios' });

    const equipo = await EquipoAVL.findOne({ ID: equipoId }).lean();
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });

    const yaAsignado = await Movil.findOne(buildEquipoPrincQueryById(equipoId), { Patente: 1 }).lean();
    if (yaAsignado) return res.status(400).json({ message: `El equipo ${equipoId} ya está asignado al móvil ${yaAsignado.Patente}` });

    const movil = await Movil.findOne({ Patente: new RegExp(`^${patente}$`, 'i') });
    if (!movil) return res.status(404).json({ message: `No existe móvil con patente ${patente}` });

    movil['Equipo Princ'] = { '': equipoId };
    await movil.save();

    res.json(bsonToJsonSafe({ message: 'Equipo asignado correctamente', movilId: movil._id, patente: movil.Patente, equipoId }));
  } catch (err) {
    res.status(500).json({ message: 'Error al asignar equipo a móvil', error: err.message });
  }
};

exports.assignSimcardToEquipo = async (req, res) => {
  try {
    const { Simcard, EquipoAVL } = req.models;
    const iccid = (req.body.iccid || '').trim();
    const equipoId = toNumberSafe(req.body.equipoId);

    if (!iccid || equipoId === null) return res.status(400).json({ message: 'iccid y equipoId son obligatorios' });

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