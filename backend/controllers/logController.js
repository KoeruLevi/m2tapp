const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log('Datos recibidos:', { email, password });

    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const user = await Usuario.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Comparar contraseñas sin encriptación
        if (password !== user.password) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user });
    } catch (error) {
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
        // Crear el nuevo usuario (sin encriptar la contraseña)
        const newUser = new Usuario({
            nombre,
            email,
            password, // Contraseña en texto plano
            rol,
        });

        await newUser.save();
        res.json({ message: 'Usuario registrado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};