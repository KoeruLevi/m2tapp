const mongoose = require('mongoose');

const EquipoAVLSchema = new mongoose.Schema({
    IMEI: { type: String },
    numeroSerie: { type: String },
    firmware: { type: String },
    fabricante: { type: String },
    modelo: { type: String },
    estado: { type: String },
    movil_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Movil' },
    simcard_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Simcard' },
}, { collection: 'EquipoAVL' }); // Nombre exacto de la colección

module.exports = mongoose.model('EquipoAVL', EquipoAVLSchema);