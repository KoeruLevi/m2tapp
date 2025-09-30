const mongoose = require('mongoose');

const EquipoAVLSchema = new mongoose.Schema({
    imei: { type: String },
    serial: { type: String},
    current_firmware: { type: String },
    ID: { type: Number, unique: true },
}, { collection: 'EquipoAVL',
    timestamps: true
});

module.exports = EquipoAVLSchema;