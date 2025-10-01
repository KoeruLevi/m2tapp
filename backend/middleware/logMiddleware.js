const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'Falta token de autorización' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload: { id, rol, ... }

    // Carga mínima garantizada (no depende de DB)
    req.user = { _id: payload.id, rol: payload.rol };

    // (Opcional) intenta enriquecer con datos reales si el modelo está disponible:
    try {
      // Usa el modelo "global" de Usuario (conexión por defecto / histórica)
      const Usuario = require('../models/Usuario');
      const userDoc = await Usuario.findById(payload.id).lean();
      if (userDoc) {
        req.user = {
          _id: userDoc._id,
          nombre: userDoc.nombre,
          email: userDoc.email,
          rol: userDoc.rol
        };
      }
    } catch (_) {
      // si falla, seguimos con lo que trae el JWT
    }

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};