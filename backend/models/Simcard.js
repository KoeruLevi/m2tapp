const mongoose = require('mongoose');

const SimcardSchema = new mongoose.Schema({
    ICCID: { type: String, required: true, unique: true }, // Asegura que el ICCID sea único
    fono: { type: Number, required: true }, // Asegura que el fono sea requerido
    operador: { type: String, required: true }, // Operador requerido
    portador: { type: String }, // Opcional
    estado: { type: String, enum: ['Activo', 'Inactivo', 'Suspendido'], default: 'Activo' }, // Opciones predefinidas
    quota: { type: String },
    ID: { type: Number, ref: 'EquipoAVL', required: true }, // Relación con EquipoAVL
}, { collection: 'Simcard' });

module.exports = mongoose.model('Simcard', SimcardSchema);