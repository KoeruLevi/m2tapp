const Ticket = require('../models/Ticket');
const Usuario = require('../models/Usuario');
const Counter = require('../models/Counter');
const { sendMail } = require('../utils/mailer');

const atLeastHalf = (doneCount, total) => total === 0 ? true : (doneCount / total) >= 0.5;
const canManage = (user, ticket) =>
  user && (user.rol === 'admin' || String(ticket.createdBy) === String(user._id));

/** VO listo para UI */
function viewOf(ticket) {
  const t = ticket;
  const total = t.assignees?.length || 0;
  const done = t.marks?.assigneesDone?.length || 0;
  const now = new Date();

  return {
    _id: t._id,
    number: t.number,
    title: t.title,
    body: t.body,
    result: t.result || '',
    dueAt: t.dueAt || null,
    status: t.status,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,

    overdue: t.status === 'open' && t.dueAt && t.dueAt < now,

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


exports.list = async (req, res) => {
  try {
    const { status = 'open', mine = '', page = 1, limit = 20, search = '' } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const L = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (p - 1) * L;

    const q = {};
    if (status !== 'all' && status !== 'late') q.status = status;
    if (status === 'late') {
      q.status = 'open';
      q.dueAt = { $lt: new Date() };
    }

    if (mine === 'created') q.createdBy = req.user._id;
    if (mine === 'assigned') q.assignees = req.user._id;

    if (search) {
      q.$or = [
        { title: new RegExp(search, 'i') },
        { body:  new RegExp(search, 'i') },
        { result:new RegExp(search, 'i') }
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

exports.create = async (req, res) => {
  try {
    const { title, body, assignees = [], dueAt } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'title y body son obligatorios' });
    }

    // Validar y normalizar IDs de asignados
    const userIds = Array.from(new Set(assignees.map(String)));
    const users = await Usuario.find(
      { _id: { $in: userIds } },
      { _id: 1, email: 1, nombre: 1 }
    ).lean();

    // Número correlativo
    const seq = await Counter.findOneAndUpdate(
      { key: 'ticket' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const number = seq.seq;

    // Crear ticket
    const ticket = await Ticket.create({
      number,
      title,
      body,
      createdBy: req.user._id,
      assignees: users.map(u => u._id),
      dueAt: dueAt ? new Date(dueAt) : null
    });

    // Recuperar con populate para enviar a la UI
    const created = await Ticket.findById(ticket._id)
      .populate('createdBy', 'nombre email')
      .populate('assignees', 'nombre email')
      .lean();

    // Responder a la UI de inmediato (no bloquear por enviar correo)
    const payload = viewOf(created);
    res.status(201).json(payload);

    // Enviar correo en background (no bloquea la respuesta)
    setImmediate(async () => {
      try {
        if (!users.length) return;

        const to = users.map(u => u.email).filter(Boolean);
        if (!to.length) return;

        const subj = `[Ticket #${payload.number}] ${payload.title}`;
        const limit = payload.dueAt
          ? new Date(payload.dueAt).toLocaleString('es-CL')
          : '—';
        const appUrl = process.env.APP_URL || 'https://m2tapp.vercel.app';

        const text = `Se te asignó el Ticket #${payload.number}

Título: ${payload.title}

Descripción:
${payload.body}

Fecha límite: ${limit}

Ir a la app: ${appUrl}/tickets
`;

        const html = `
          <p>Se te asignó el <b>Ticket #${payload.number}</b></p>
          <p><b>Título:</b> ${payload.title}</p>
          <p><b>Descripción:</b><br/>${String(payload.body || '')
            .replace(/\n/g, '<br/>')}</p>
          <p><b>Fecha límite:</b> ${limit}</p>
          <p><a href="${appUrl}/tickets" target="_blank" rel="noopener">Abrir en la app</a></p>
        `;

        await sendMail({ to, subject: subj, text, html });
      } catch (e) {
        console.log('[TICKETS] Error enviando correo (background):', e?.message || e);
      }
    });
  } catch (err) {
    // Si algo falla ANTES de responder 201, devolvemos 500
    return res.status(500).json({ message: 'Error al crear ticket', error: err.message });
  }
};


exports.updateMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const t = await Ticket.findById(id);
    if (!t) return res.status(404).json({ message: 'Ticket no encontrado' });
    if (!canManage(req.user, t)) return res.status(403).json({ message: 'No autorizado' });

    if (typeof req.body.result === 'string') t.result = req.body.result.trim();
    if (req.body.dueAt !== undefined) t.dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;

    await t.save();

    const withPop = await Ticket.findById(id)
      .populate('createdBy', 'nombre email')
      .populate('assignees', 'nombre email')
      .lean();
    res.json(viewOf(withPop));
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar ticket', error: err.message });
  }
};

/** PUT /api/tickets/:id/done  { done: true|false, result? }  (creador o asignado) */
exports.markDone = async (req, res) => {
  try {
    const { id } = req.params;
    const done = !!req.body.done;
    const incomingResult = typeof req.body.result === 'string' ? req.body.result.trim() : undefined;

    const t = await Ticket.findById(id);
    if (!t) return res.status(404).json({ message: 'Ticket no encontrado' });

    const isCreator = String(t.createdBy) === String(req.user._id);
    const isAssigned = t.assignees.some(a => String(a) === String(req.user._id));
    if (!isCreator && !isAssigned) return res.status(403).json({ message: 'No autorizado' });

    // si viene resultado, lo guardamos
    if (incomingResult !== undefined) t.result = incomingResult;

    // si intenta marcar listo y NO hay resultado => bloquear
    if (done && (!t.result || !t.result.trim())) {
      return res.status(400).json({ message: 'Debes ingresar un resultado antes de marcar como listo.' });
    }

    if (isCreator) {
      t.marks.creatorDone = done;
    } else {
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

/** PUT /api/tickets/:id/close  (manual: creador o admin)  { result? } */
exports.closeManual = async (req, res) => {
  try {
    const { id } = req.params;
    const incomingResult = typeof req.body.result === 'string' ? req.body.result.trim() : undefined;

    const t = await Ticket.findById(id);
    if (!t) return res.status(404).json({ message: 'Ticket no encontrado' });
    if (!canManage(req.user, t)) return res.status(403).json({ message: 'No autorizado' });

    if (incomingResult !== undefined) t.result = incomingResult;
    if (!t.result || !t.result.trim()) {
      return res.status(400).json({ message: 'Debes ingresar un resultado antes de cerrar el ticket.' });
    }

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

/** PUT /api/tickets/:id/reopen  (creador o admin) */
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

/** DELETE /api/tickets/:id */
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

/** GET /api/tickets/users-lite */
exports.usersLite = async (_req, res) => {
  try {
    const users = await Usuario.find({}, { nombre: 1, email: 1 }).sort({ nombre: 1 }).lean();
    res.json(users.map(u => ({ _id: u._id, nombre: u.nombre, email: u.email })));
  } catch (err) {
    res.status(500).json({ message: 'Error al listar usuarios', error: err.message });
  }
};