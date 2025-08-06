const express = require('express');
const { login, register, getUsers } = require('../controllers/logController');
const router = express.Router();
const auth = require('../middleware/logMiddleware.js');
const { updateUsuario } = require('../controllers/logController');
const isAdmin = require('../middleware/isAdmin');


router.get('/dashboard', auth, (req, res) => {
    res.json({ message: 'Acceso permitido', user: req.user });
});

router.get('/users', getUsers);
router.post('/login', login);
router.post('/register', auth, isAdmin, register);
router.put('/updateUser', auth, updateUsuario);

module.exports = router;