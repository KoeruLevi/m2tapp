const ClienteSchema         = require('../models/schemas/ClienteSchema');
const EquipoAVLSchema       = require('../models/schemas/EquipoAVLSchema');
const MovilSchema           = require('../models/schemas/MovilSchema');
const SimcardSchema         = require('../models/schemas/SimcardSchema');
const HistorialCambioSchema = require('../models/schemas/HistorialCambioSchema');

module.exports = function buildModels(conn) {
  return {
    Cliente:         conn.model('Cliente', ClienteSchema, 'Cliente'),
    Movil:           conn.model('Movil', MovilSchema, 'Movil'),
    EquipoAVL:       conn.model('EquipoAVL', EquipoAVLSchema, 'EquipoAVL'),
    Simcard:         conn.model('Simcard', SimcardSchema, 'Simcard'),
    HistorialCambio: conn.model('HistorialCambio', HistorialCambioSchema, 'HistorialCambio'),
  };
};