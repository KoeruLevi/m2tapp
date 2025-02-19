const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    nombre: { type: String, required: true },
    rol: { type: String, required: true }, // Ejemplo: 'master', 'admin', 'user'
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ultimoAcceso: { type: Date, default: Date.now },
}, { collection: 'Usuario' });

module.exports = mongoose.model('Usuario', UsuarioSchema);