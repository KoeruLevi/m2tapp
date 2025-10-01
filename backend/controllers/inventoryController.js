const getModels = (req) => {
  // si ya usas un middleware que pone req.models, úsalo:
  if (req.models) return req.models;
  // Fallback si aún no migraste: require de /models (histórico)
  return {
    Cliente: require('../models/Cliente'),
    Movil: require('../models/Movil'),
    EquipoAVL: require('../models/EquipoAVL'),
    Simcard: require('../models/Simcard'),
  };
};
const { bsonToJsonSafe } = require('../utils/bsonSafe');

exports.listEquipos = async (req, res) => {
  const { EquipoAVL, Movil } = getModels(req);
  const { q = '', page = 1, pageSize = 20 } = req.query;
  const filter = q
    ? { $or: [{ imei: new RegExp(q, 'i') }, { serial: new RegExp(q, 'i') }, { ID: Number(q) || -1 }] }
    : {};
  const total = await EquipoAVL.countDocuments(filter);
  const data = await EquipoAVL.find(filter)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(Number(pageSize))
    .lean();

  // marca si están asignados
  const ids = data.map(e => e.ID);
  const moviles = await Movil.find({ 'Equipo Princ': { $in: ids.map(id => ({ '': id })) } }, { Patente: 1, 'Equipo Princ': 1 }).lean();
  const byId = new Map(
    moviles.map(m => [(m['Equipo Princ']?.[''] ?? m['Equipo Princ']), m.Patente])
  );
  data.forEach(e => e.__asignadoA = byId.get(e.ID) || null);

  res.json(bsonToJsonSafe({ total, page: Number(page), pageSize: Number(pageSize), data }));
};

exports.listSimcards = async (req, res) => {
  const { Simcard } = getModels(req);
  const { q = '', page = 1, pageSize = 20 } = req.query;
  const filter = q
    ? {
        $or: [
          { operador: new RegExp(q, 'i') },
          { portador: new RegExp(q, 'i') },
          { ICCID: q }, // si viene Long, se comparará por string en UI
          { fono: Number(q) || -1 },
          { ID: Number(q) || -1 }
        ]
      }
    : {};
  const total = await Simcard.countDocuments(filter);
  const data = await Simcard.find(filter)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(Number(pageSize))
    .lean();

  res.json(bsonToJsonSafe({ total, page: Number(page), pageSize: Number(pageSize), data }));
};

exports.assignEquipoToMovil = async (req, res) => {
  const { Movil, EquipoAVL } = getModels(req);
  const { equipoId, patente } = req.body;

  if (!equipoId || !patente) return res.status(400).json({ message: 'equipoId y patente son obligatorios' });

  const equipo = await EquipoAVL.findOne({ ID: Number(equipoId) });
  if (!equipo) return res.status(404).json({ message: 'Equipo no existe' });

  const ocupados = await Movil.findOne({ $or: [{ 'Equipo Princ': Number(equipoId) }, { 'Equipo Princ.': Number(equipoId) }] });
  if (ocupados) return res.status(400).json({ message: 'Equipo ya está asignado a un móvil' });

  const movil = await Movil.findOne({ Patente: patente });
  if (!movil) return res.status(404).json({ message: 'Patente no existe' });

  await Movil.updateOne({ _id: movil._id }, { $set: { 'Equipo Princ': { '': Number(equipoId) } } });
  res.json(bsonToJsonSafe({ message: 'Equipo asignado', movilId: movil._id }));
};

exports.assignSimcardToEquipo = async (req, res) => {
  const { Simcard, EquipoAVL } = getModels(req);
  const { simIccid, equipoId } = req.body;

  if (!simIccid || !equipoId) return res.status(400).json({ message: 'simIccid y equipoId son obligatorios' });

  const equipo = await EquipoAVL.findOne({ ID: Number(equipoId) });
  if (!equipo) return res.status(404).json({ message: 'Equipo no existe' });

  const sim = await Simcard.findOne({ ICCID: simIccid });
  if (!sim) return res.status(404).json({ message: 'ICCID no existe' });

  await Simcard.updateOne({ _id: sim._id }, { $set: { ID: Number(equipoId) } });
  res.json(bsonToJsonSafe({ message: 'Simcard asignada', simId: sim._id }));
};