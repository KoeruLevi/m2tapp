const mongoose = require('mongoose');

const SimcardSchema = new mongoose.Schema({
    _id: { type: String }, // Identificador legible
    ICCID: { type: String },
    numeroTelefonico: { type: String },
    operador: { type: String },
    portador: { type: String },
    estado: { type: String },
    cuotaDatos: { type: String },
    equipoAVL_id: { type: String, ref: 'EquipoAVL' }, // Referencia basada en string
}, { collection: 'Simcard' });

module.exports = mongoose.model('Simcard', SimcardSchema);