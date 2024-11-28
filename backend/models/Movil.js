const mongoose = require('mongoose');

const MovilSchema = new mongoose.Schema({
    condicion: { type: String },
    tipo: { type: String },
    marca: { type: String },
    patente: { type: String },
    cliente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    velocidadMaxima: { type: Number },
    mandante: { type: String },
    webservice: { type: String },
    descripcionInterna: { type: String },
    alimentacionPrincipal: { type: String },
    equipoPrimario: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipoAVL' },
    equipoSecundario: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipoAVL' },
    accesorios: [
        {
            tipo: { type: String },
            id: { type: String },
            observaciones: { type: String },
        },
    ],
}, { collection: 'Movil' }); // Nombre exacto de la colección

module.exports = mongoose.model('Movil', MovilSchema);