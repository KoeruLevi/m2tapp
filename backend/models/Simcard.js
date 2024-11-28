const mongoose = require('mongoose');

const SimcardSchema = new mongoose.Schema({
    ICCID: { type: String },
    numeroTelefonico: { type: String },
    operador: { type: String },
    portador: { type: String },
    estado: { type: String },
    cuotaDatos: { type: String },
    equipoAVL_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipoAVL' },
}, { collection: 'Simcard' }); // Nombre exacto de la colección

module.exports = mongoose.model('Simcard', SimcardSchema);