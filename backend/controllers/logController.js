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

        const validPassword = await bcrypt.compare(password, user.password);
        console.log('[LOGIN] ¿Password coincide?', validPassword);

        if (!validPassword) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const { password: pass, ...userSafe } = user._doc;
        res.json({ token, user: userSafe });
    } catch (error) {
        console.log('[LOGIN] Error:', error.message);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};


exports.getUsers = async (req, res) => {
    try {
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

exports.updateUsuario = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        const jwt = require("jsonwebtoken");
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Usuario.findById(payload.id);

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        if (req.body.nombre) user.nombre = req.body.nombre;
        if (req.body.email) user.email = req.body.email;
        if (req.body.rol) user.rol = req.body.rol;
        if (req.body.password) {
            const bcrypt = require("bcryptjs");
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();
        res.json({ message: "Usuario actualizado correctamente" });
    } catch (err) {
        res.status(500).json({ message: "Error al actualizar usuario", error: err.message });
    }
};