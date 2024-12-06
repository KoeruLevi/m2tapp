const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    _id: { type: String }, // Identificador legible
    nombre: { type: String, required: true },
    razonSocial: { type: String },
    RUT: { type: String },
    domicilio: { type: String },
    emails: { type: [String] },
    contactos: { type: Array },
    moviles_ids: { type: [String] }, // Referencias a moviles como strings
}, { collection: 'Cliente' });

module.exports = mongoose.model('Cliente', ClienteSchema);