const mongoose = require('mongoose');

const MovilSchema = new mongoose.Schema({
    _id: { type: String }, // Identificador legible
    condicion: { type: String },
    tipo: { type: String },
    marca: { type: String },
    patente: { type: String },
    cliente_id: { type: String, ref: 'Cliente' }, // Referencia basada en string
    velocidadMaxima: { type: Number },
    mandante: { type: String },
    webservice: { type: String },
    descripcionInterna: { type: String },
    alimentacionPrincipal: { type: String },
    equipoPrimario: { type: String, ref: 'EquipoAVL' },
    equipoSecundario: { type: String, ref: 'EquipoAVL' },
    accesorios: [
        {
            tipo: { type: String },
            id: { type: String },
            observaciones: { type: String },
        },
    ],
}, { collection: 'Movil' }); // Nombre exacto de la colección

module.exports = mongoose.model('Movil', MovilSchema);