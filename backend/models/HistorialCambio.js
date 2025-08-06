const mongoose = require('mongoose');

const HistorialCambioSchema = new mongoose.Schema({
    entidad: { type: String, required: true },
    entidadId: { type: mongoose.Schema.Types.ObjectId, required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha: { type: Date, default: Date.now },
    cambios: [{
        campo: String,
        valorAnterior: mongoose.Schema.Types.Mixed,
        valorNuevo: mongoose.Schema.Types.Mixed
    }]
}, { collection: 'HistorialCambio' });

module.exports = mongoose.model('HistorialCambio', HistorialCambioSchema);