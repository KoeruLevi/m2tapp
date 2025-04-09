const mongoose = require('mongoose');

const MovilSchema = new mongoose.Schema({
   Patente: { type: String, required: true },
   Cliente: { type: String, required: true },
   'CONDICION \nMOVIL': { type: String },
   Suspendido: { type: Boolean, default: false },
   Nombre: { type: mongoose.Schema.Types.Mixed },
   Interno: { type: String },
   'ACTIVO EN \nTRASAT_1': { type: Boolean },
   'ACTIVO EN \nAKITA': { type: Boolean },
   'ACTIVO EN\nTgo': { type: Boolean },
   Marca: { type: String },
   Tipo: { type: String },
   Chofer: { type: String },
   'Equipo Princ': { 
       type: mongoose.Schema.Types.Mixed
   },
   'TECNOLOGIA \nEQUIPO': { type: String },
   'FECHA INSTALACION EQUIPO': { type: String },
   'Equipo Secundario_1': { type: Number },
   'Equipo Secundario_2': { type: String },
   'Equipo Secundario_3': { type: String },
   Acc: {
       type: Map,
       of: mongoose.Schema.Types.Mixed
   },
   Id: {
       type: Map,
       of: String
   },
   'Tecnico\nInstalador': { type: String },
   NOTAS: { type: String },
   'IMAGEN \nINSTALACION': { type: String },
   IMAGEN_1: { type: String },
   IMAGEN_2: { type: String },
   IMAGEN_3: { type: String },
   IMAGEN_4: { type: String },
   'ORIGEN DEL DATO': { type: String }
}, { collection: 'Movil',
    timestamps: true
});

module.exports = mongoose.model('Movil', MovilSchema);