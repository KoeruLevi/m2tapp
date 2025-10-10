const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

function esMaster(user) {
    return user && (user.email === process.env.MASTER_USER_EMAIL);
}

function solicitanteEsMaster(req) {
  return req.user?.email === process.env.MASTER_USER_EMAIL;
}
exports.login = async (req, res) => {
    const { email, password } = req.body;
    

    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    try {
        const user = await Usuario.findOne({ email });
        if (!user) {
            console.log('[LOGIN] Usuario no encontrado');
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        

        const validPassword = await bcrypt.compare(password, user.password);
        console.log('[LOGIN] ¿Password coincide?', validPassword);

        if (!validPassword) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const { password: pass, ...userSafe } = user._doc;
        res.json({ token, user: { ...userSafe, isMaster: esMaster(user) } });
    } catch (error) {
        console.log('[LOGIN] Error:', error.message);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};


exports.getUsers = async (req, res) => {
  try {
    const users = await Usuario.find().lean();
    const withFlag = users.map(u => ({ ...u, isMaster: esMaster(u) }));
    res.status(200).json(withFlag);
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

exports.updateMe = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        const jwt = require("jsonwebtoken");
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Usuario.findById(payload.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        if (req.body.nombre) user.nombre = req.body.nombre;
        if (req.body.email) user.email = req.body.email;
        if (req.body.password) {
            const bcrypt = require("bcryptjs");
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();
        res.json({ message: "Tus datos han sido actualizados correctamente" });
    } catch (err) {
        res.status(500).json({ message: "Error al actualizar datos", error: err.message });
    }
};

exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Usuario.findById(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    if (esMaster(user)) {
      return res.status(403).json({ message: "El usuario master no puede ser eliminado" });
    }

    await user.deleteOne();
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar usuario", error: err.message });
  }
};

exports.updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Usuario.findById(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const tocaMaster = esMaster(user);
    const yoSoyMaster = solicitanteEsMaster(req);

    if (tocaMaster && !yoSoyMaster) {
      // permitimos nombre/email, pero NO rol ni password
      if ('rol' in req.body || 'password' in req.body) {
        return res.status(403).json({ message: "Solo el master puede cambiar rol o contraseña del master" });
      }
    }

    if (req.body.nombre) user.nombre = req.body.nombre;
    if (req.body.email)  user.email  = req.body.email;

    if ('rol' in req.body && !(tocaMaster && !yoSoyMaster)) {
      // adicionalmente puedes impedir cambiar rol del master incluso por el master si quieres
      user.rol = req.body.rol;
    }

    if (req.body.password && !(tocaMaster && !yoSoyMaster)) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    await user.save();
    res.json({ message: "Usuario actualizado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar usuario", error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await Usuario.findById(id);
    if (!target) return res.status(404).json({ message: "Usuario no encontrado" });

    if (esMaster(target) && !solicitanteEsMaster(req)) {
      return res.status(403).json({ message: "Solo el master puede resetear la contraseña del master" });
    }

    // genera una contraseña temporal de 12 chars alfanumérica
    const temp = crypto.randomBytes(9).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0,12);
    const salt = await bcrypt.genSalt(10);
    target.password = await bcrypt.hash(temp, salt);
    await target.save();

    res.json({ message: "Contraseña reseteada", tempPassword: temp });
  } catch (err) {
    res.status(500).json({ message: "Error al resetear contraseña", error: err.message });
  }
};

exports.changePasswordByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, confirm } = req.body;

    if (!newPassword || !confirm) {
      return res.status(400).json({ message: "Falta nueva contraseña y confirmación" });
    }
    if (newPassword !== confirm) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
    }

    const target = await Usuario.findById(id);
    if (!target) return res.status(404).json({ message: "Usuario no encontrado" });

    if (esMaster(target) && !solicitanteEsMaster(req)) {
      return res.status(403).json({ message: "Solo el master puede cambiar la contraseña del master" });
    }

    const salt = await bcrypt.genSalt(10);
    target.password = await bcrypt.hash(newPassword, salt);
    await target.save();

    res.json({ message: "Contraseña actualizada" });
  } catch (err) {
    res.status(500).json({ message: "Error al cambiar contraseña", error: err.message });
  }
};