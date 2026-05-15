const Ticket = require('../models/Ticket');
const Usuario = require('../models/Usuario');
const Counter = require('../models/Counter');
const { sendMail } = require('../utils/mailer');

const atLeastHalf = (doneCount, total) => total === 0 ? true : (doneCount / total) >= 0.5;
const canManage = (user, ticket) =>
  user && (user.rol === 'admin' || String(ticket.createdBy) === String(user._id));
const canEditResult = (user, ticket) => {
  if (!user || !ticket) return false;
  if (user.rol === 'admin') return true;
  if (String(ticket.createdBy) === String(user._id)) return true;
  return (ticket.assignees || []).some(a => String(a) === String(user._id));
};
function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function nl2br(value = '') {
  return escapeHtml(value).replace(/\r?\n/g, '<br/>');
}

function buildTicketAssignedText({ ticket, limit, appUrl }) {
  return `Se te asignó el Ticket #${ticket.number}

Título: ${ticket.title}

Descripción:
${ticket.body}

Fecha límite: ${limit}

Ir a la app: ${appUrl}/tickets
`;
}

function buildTicketAssignedHtml({ ticket, limit, appUrl }) {
  const safeNumber = escapeHtml(ticket.number);
  const safeTitle = escapeHtml(ticket.title);
  const safeBody = nl2br(ticket.body);
  const safeLimit = escapeHtml(limit);
  const safeAppUrl = escapeHtml(`${appUrl}/tickets`);

  return `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background:#eef6ff; font-family:Arial, Helvetica, sans-serif; color:#0b2f57;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Se te asignó el Ticket #${safeNumber}: ${safeTitle}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef6ff; padding:28px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:94%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.10);">
            
            <tr>
              <td style="background:#007bff; padding:22px 28px; color:#ffffff;">
                <div style="font-size:22px; font-weight:700; letter-spacing:.2px;">
                  Soporte M2T
                </div>
                <div style="font-size:14px; opacity:.92; margin-top:4px;">
                  Nuevo ticket asignado
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px;">
                <div style="margin-bottom:18px;">
                  <span style="display:inline-block; background:#e8f1ff; color:#0057c2; border:1px solid #cfe3ff; border-radius:999px; padding:7px 12px; font-size:13px; font-weight:700;">
                    Ticket #${safeNumber}
                  </span>
                </div>

                <h1 style="margin:0 0 12px; font-size:24px; line-height:1.25; color:#003b73;">
                  ${safeTitle}
                </h1>

                <p style="margin:0 0 22px; font-size:15px; line-height:1.6; color:#334;">
                  Se te asignó un nuevo ticket en la plataforma de soporte M2T.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 22px;">
                  <tr>
                    <td style="padding:14px 16px; background:#f7fbff; border:1px solid #dbeafe; border-radius:12px;">
                      <div style="font-size:13px; font-weight:700; color:#1f3b82; margin-bottom:8px;">
                        Descripción
                      </div>
                      <div style="font-size:15px; line-height:1.6; color:#222;">
                        ${safeBody || '—'}
                      </div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 24px;">
                  <tr>
                    <td style="padding:14px 16px; background:#fff8e6; border:1px solid #ffe0a3; border-radius:12px;">
                      <div style="font-size:13px; font-weight:700; color:#8a5a00; margin-bottom:4px;">
                        Fecha límite
                      </div>
                      <div style="font-size:16px; font-weight:700; color:#4a3200;">
                        ${safeLimit}
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="text-align:center; margin:28px 0 10px;">
                  <a href="${safeAppUrl}" target="_blank" rel="noopener" style="display:inline-block; background:#007bff; color:#ffffff; text-decoration:none; padding:13px 22px; border-radius:10px; font-size:15px; font-weight:700;">
                    Abrir ticket en M2Tapp
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px; background:#f5f8fc; border-top:1px solid #e6eef8; color:#667; font-size:12px; line-height:1.5;">
                Este correo fue generado automáticamente por la plataforma de soporte M2T.
                <br/>
                No respondas directamente a este mensaje si el buzón no está habilitado para respuestas.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}
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

        const text = buildTicketAssignedText({
          ticket: payload,
          limit,
          appUrl,
        });

        const html = buildTicketAssignedHtml({
          ticket: payload,
          limit,
          appUrl,
        });

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

    const wantsResult = typeof req.body.result === 'string';
    const wantsDueAt = req.body.dueAt !== undefined;

    // Permisos:
    // - result: admin / creador / asignado
    // - dueAt: admin / creador
    if (wantsResult && !canEditResult(req.user, t)) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    if (wantsDueAt && !canManage(req.user, t)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    if (wantsResult) t.result = req.body.result.trim();
    if (wantsDueAt) t.dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;

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