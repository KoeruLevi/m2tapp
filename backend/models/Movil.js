const mongoose = require('mongoose');

const MovilSchema = new mongoose.Schema({
    condicion: String,
    tipo: String,
    marca: String,
    patente: String,
    cliente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    velocidadMaxima: Number,
    mandante: String,
    webservice: String,
    descripcionInterna: String,
    alimentacionPrincipal: String,
    equipoPrimario: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipoAVL' },
    equipoSecundario: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipoAVL' },
    accesorios: [
        {
            tipo: String,
            id: String,
            observaciones: String,
        },
    ],
});

module.exports = mongoose.model('Movil', MovilSchema);