const mongoose = require('mongoose');

const EquipoAVLSchema = new mongoose.Schema({
    imei: { type: String },
    serial: { type: String},
    current_firmware: { type: String },
    ID: { type: Number, unique: true }, // ID único para enlazar con Movil
}, { collection: 'EquipoAVL' });

module.exports = mongoose.model('EquipoAVL', EquipoAVLSchema);