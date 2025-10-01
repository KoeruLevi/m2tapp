const Ticket = require('../models/Ticket');
const Usuario = require('../models/Usuario');

const atLeastHalf = (doneCount, total) => total === 0 ? true : (doneCount / total) >= 0.5;

const canManage = (user, ticket) =>
  user && (user.rol === 'admin' || String(ticket.createdBy) === String(user._id));

/** Devuelve un VO ya "listo para UI" */
function viewOf(ticket) {
  const t = ticket;
  const total = t.assignees?.length || 0;
  const done = t.marks?.assigneesDone?.length || 0;
  return {
    _id: t._id,
    title: t.title,
    body: t.body,
    status: t.status,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,

    createdBy: t.createdBy && {
      _id: t.createdBy._id, nombre: t.createdBy.nombre, email: t.createdBy.email
    },
    assignees: (t.assignees || []).map(a => ({ _id: a._id, nombre: a.nombre, email: a.email })),

    progress: {
      creatorDone: !!(t.marks && t.marks.creatorDone),
      doneAssignees: done,
      totalAssignees: total
    },

    closedAt: t.closedAt,
    closedReason: t.closedReason
  };
}

/** GET /api/tickets?status=open|closed|all&mine=assigned|created&page=1&limit=20&search= */
exports.list = async (req, res) => {
  try {
    const { status = 'open', mine = '', page = 1, limit = 20, search = '' } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const L = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (p - 1) * L;

    const q = {};
    if (status !== 'all') q.status = status;

    if (mine === 'created') q.createdBy = req.user._id;
    if (mine === 'assigned') q.assignees = req.user._id;

    if (search) {
      q.$or = [
        { title: new RegExp(search, 'i') },
        { body:  new RegExp(search, 'i') }
      ];
    }

    const [total, rows] = await Promise.all([
      Ticket.countDocuments(q),
      Ticket.find(q)
        .sort({ updatedAt: -1 })
        .skip(skip).limit(L)
        .populate('createdBy', 'nombre email')
        .populate('assignees', 'nombre email')
        .lean()
    ]);

    res.json({
      items: rows.map(viewOf),
      page: p, limit: L, total, pages: Math.max(Math.ceil(total / L), 1)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al listar tickets', error: err.message });
  }
};

/** POST /api/tickets  { title, body, assignees: [userId] } */
exports.create = async (req, res) => {
  try {
    const { title, body, assignees = [] } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'title y body son obligatorios' });

    // validar usuarios
    const userIds = Array.from(new Set(assignees.map(String)));
    const users = await Usuario.find({ _id: { $in: userIds } }, { _id: 1 }).lean();

    const ticket = await Ticket.create({
      title, body,
      createdBy: req.user._id,
      assignees: users.map(u => u._id),
    });

    const created = await Ticket.findById(ticket._id)
      .populate('createdBy', 'nombre email')
      .populate('assignees', 'nombre email')
      .lean();

    res.status(201).json(viewOf(created));
  } catch (err) {
    res.status(500).json({ message: 'Error al crear ticket', error: err.message });
  }
};

/** PUT /api/tickets/:id/done  { done: true|false }  (creador o asignado) */
exports.markDone = async (req, res) => {
  try {
    const { id } = req.params;
    const done = !!req.body.done;

    const t = await Ticket.findById(id);
    if (!t) return res.status(404).json({ message: 'Ticket no encontrado' });

    const isCreator = String(t.createdBy) === String(req.user._id);
    const isAssigned = t.assignees.some(a => String(a) === String(req.user._id));
    if (!isCreator && !isAssigned) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    if (isCreator) {
      t.marks.creatorDone = done;
    } else {
      // toggle en arreglo
      const idx = t.marks.assigneesDone.findIndex(u => String(u) === String(req.user._id));
      if (done && idx === -1) t.marks.assigneesDone.push(req.user._id);
      if (!done && idx !== -1) t.marks.assigneesDone.splice(idx, 1);
    }

    // ¿cierre automático?
    const doneAssignees = t.marks.assigneesDone.length;
    const totalAssignees = t.assignees.length;
    const meets50 = atLeastHalf(doneAssignees, totalAssignees);
    const creatorOK = !!t.marks.creatorDone;

    if (t.status === 'open' && creatorOK && meets50) {
      t.status = 'closed';
      t.closedAt = new Date();
      t.closedReason = 'auto';
      t.closedBy = req.user._id;
    }

    await t.save();

    const withPop = await Ticket.findById(id)
      .populate('createdBy', 'nombre email')
      .populate('assignees', 'nombre email')
      .lean();

    res.json(viewOf(withPop));
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar estado', error: err.message });
  }
};

/** PUT /api/tickets/:id/close  (manual: creador o admin) */
exports.closeManual = async (req, res) => {
  try {
    const { id } = req.params;
    const t = await Ticket.findById(id);
    if (!t) return res.status(404).json({ message: 'Ticket no encontrado' });
    if (!canManage(req.user, t)) return res.status(403).json({ message: 'No autorizado' });

    t.status = 'closed';
    t.closedAt = new Date();
    t.closedBy = req.user._id;
    t.closedReason = 'manual';
    await t.save();

    const withPop = await Ticket.findById(id)
      .populate('createdBy', 'nombre email')
      .populate('assignees', 'nombre email')
      .lean();

    res.json(viewOf(withPop));
  } catch (err) {
    res.status(500).json({ message: 'Error al cerrar ticket', error: err.message });
  }
};

/** PUT /api/tickets/:id/reopen  (creador o admin). Resetea marcas. */
exports.reopen = async (req, res) => {
  try {
    const { id } = req.params;
    const t = await Ticket.findById(id);
    if (!t) return res.status(404).json({ message: 'Ticket no encontrado' });
    if (!canManage(req.user, t)) return res.status(403).json({ message: 'No autorizado' });

    t.status = 'open';
    t.closedAt = null;
    t.closedBy = null;
    t.closedReason = null;
    t.marks.creatorDone = false;
    t.marks.assigneesDone = [];
    t.reopenEvents.push({ at: new Date(), by: req.user._id });
    await t.save();

    const withPop = await Ticket.findById(id)
      .populate('createdBy', 'nombre email')
      .populate('assignees', 'nombre email')
      .lean();

    res.json(viewOf(withPop));
  } catch (err) {
    res.status(500).json({ message: 'Error al reabrir ticket', error: err.message });
  }
};

/** DELETE /api/tickets/:id  (solo si está cerrado) -> creador o admin */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const t = await Ticket.findById(id);
    if (!t) return res.status(404).json({ message: 'Ticket no encontrado' });
    if (!canManage(req.user, t)) return res.status(403).json({ message: 'No autorizado' });
    if (t.status !== 'closed') return res.status(400).json({ message: 'Solo puedes borrar tickets cerrados' });

    await t.deleteOne();
    res.json({ message: 'Ticket eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar ticket', error: err.message });
  }
};

/** GET /api/tickets/users-lite  -> lista para el selector (cualquier usuario autenticado) */
exports.usersLite = async (_req, res) => {
  try {
    const users = await Usuario.find({}, { nombre: 1, email: 1 }).sort({ nombre: 1 }).lean();
    res.json(users.map(u => ({ _id: u._id, nombre: u.nombre, email: u.email })));
  } catch (err) {
    res.status(500).json({ message: 'Error al listar usuarios', error: err.message });
  }
};