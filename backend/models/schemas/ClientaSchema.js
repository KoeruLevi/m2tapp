const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    Cliente: { type: String, required: true },
    "CONDICION \nCLIENTE": { type: String },
    RUT: { type: String },
    "Razon Social": { type: String },
    "CONTACTO_1": { type: String },
    "MAIL CONTACTO_1": { type: String },
    "Domicilio": { type: String },
    "ORIGEN DEL \nDATO": { type: String },
}, { collection: 'Cliente', 
    timestamps: true
});

module.exports = ClienteSchema;