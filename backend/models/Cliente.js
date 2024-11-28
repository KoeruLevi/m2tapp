const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    razonSocial: { type: String },
    RUT: { type: String },
    domicilio: { type: String },
    emails: { type: [String] },
    contactos: { type: Array },
    moviles_ids: { type: [String] },
}, { collection: 'Cliente' }); // Nombre exacto de la colección

module.exports = mongoose.model('Cliente', ClienteSchema);