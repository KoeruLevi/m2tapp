const mongoose = require('mongoose');

const EquipoAVLSchema = new mongoose.Schema({
    _id: { type: String }, // Identificador legible
    IMEI: { type: String },
    numeroSerie: { type: String },
    firmware: { type: String },
    fabricante: { type: String },
    modelo: { type: String },
    estado: { type: String },
    movil_id: { type: String, ref: 'Movil' }, // Referencia basada en string
    simcard_id: { type: String, ref: 'Simcard' }, // Referencia basada en string
}, { collection: 'EquipoAVL' });

module.exports = mongoose.model('EquipoAVL', EquipoAVLSchema);