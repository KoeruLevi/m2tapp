const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log('[LOGIN] Email recibido:', email);
    console.log('[LOGIN] Password recibido:', password);

    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    try {
        const user = await Usuario.findOne({ email });
        if (!user) {
            console.log('[LOGIN] Usuario no encontrado');
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        console.log('[LOGIN] Password en BD:', user.password);

        // Comparar contraseñas con bcrypt
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('[LOGIN] ¿Password coincide?', validPassword);

        if (!validPassword) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        // Genera JWT
        const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Por seguridad, no devuelvas la contraseña
        const { password: pass, ...userSafe } = user._doc;
        res.json({ token, user: userSafe });
    } catch (error) {
        console.log('[LOGIN] Error:', error.message);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};


exports.getUsers = async (req, res) => {
    try {
        // Busca todos los usuarios y excluye el campo `password` por seguridad
        const users = await Usuario.find();
        console.log('Usuarios encontrados:', users);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
    }
};

exports.register = async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new Usuario({
            nombre,
            email,
            password: hashedPassword,
            rol,
        });

        await newUser.save();
        res.json({ message: 'Usuario registrado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};