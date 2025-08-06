const mongoose = require('mongoose');

const HistorialCambioSchema = new mongoose.Schema({
    entidad: { type: String, required: true }, 
    entidadId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    usuario: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
        nombre: String,
        email: String,
        rol: String
    },
    fecha: { type: Date, default: Date.now },
    cambios: [{
        campo: String,
        valorAnterior: mongoose.Schema.Types.Mixed,
        valorNuevo: mongoose.Schema.Types.Mixed
    }]
});

module.exports = mongoose.model('HistorialCambio', HistorialCambioSchema);