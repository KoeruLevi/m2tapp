const mongoose = require('mongoose');

const SimcardSchema = new mongoose.Schema({
    ICCID: { type: String, required: true, unique: true }, 
    fono: { type: Number, required: true },
    operador: { type: String, required: true },
    portador: { type: String },
    estado: { type: String, enum: ['Activo', 'Inactivo', 'Suspendido'], default: 'Activo' }, 
    quota: { type: String },
    ID: { type: Number, ref: 'EquipoAVL', required: true }, 
}, { collection: 'Simcard',
    timestamps: true
 });

module.exports = mongoose.model('Simcard', SimcardSchema);