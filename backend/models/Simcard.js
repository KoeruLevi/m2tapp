const mongoose = require('mongoose');

const SimcardSchema = new mongoose.Schema({
    ICCID: String,
    numeroTelefonico: String,
    operador: String,
    portador: String,
    estado: String,
    cuotaDatos: String,
    equipoAVL_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipoAVL' },
});

module.exports = mongoose.model('Simcard', SimcardSchema);