const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

async function auth(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Acceso denegado, token faltante' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Usuario.findById(verified.id);
        if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

        req.user = {
            _id: user._id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
        };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido', error: error.message });
    }
}

module.exports = auth;