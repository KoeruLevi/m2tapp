const { Schema, model, Types } = require('mongoose');

const TicketSchema = new Schema(
  {
    number: { type: Number, unique: true, index: true },   // ← correlativo
    title:  { type: String, required: true, trim: true, maxlength: 160 },
    body:   { type: String, required: true, trim: true },

    result: { type: String, default: '' },                 // ← resultado
    dueAt:  { type: Date, default: null },                 // ← fecha límite

    createdBy: { type: Types.ObjectId, ref: 'Usuario', required: true },
    assignees: [{ type: Types.ObjectId, ref: 'Usuario' }],

    status: { type: String, enum: ['open', 'closed'], default: 'open' },

    marks: {
      creatorDone: { type: Boolean, default: false },
      assigneesDone: [{ type: Types.ObjectId, ref: 'Usuario' }],
    },

    closedAt: Date,
    closedBy: { type: Types.ObjectId, ref: 'Usuario' },
    closedReason: { type: String, enum: ['auto', 'manual', null], default: null },

    reopenEvents: [
      { at: Date, by: { type: Types.ObjectId, ref: 'Usuario' } }
    ]
  },
  { timestamps: true }
);

module.exports = model('Ticket', TicketSchema);