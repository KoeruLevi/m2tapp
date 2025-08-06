const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "No token provided" });

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Usuario.findById(decoded.id);
        if (!user) return res.status(401).json({ message: "Usuario no encontrado" });

        if (user.rol !== 'admin' && user.rol !== 'Admin') {
            return res.status(403).json({ message: "Solo administradores pueden realizar esta acción" });
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token inválido o expirado" });
    }
};