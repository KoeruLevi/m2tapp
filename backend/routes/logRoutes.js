const express = require('express');
const { login, register, getUsers } = require('../controllers/logController');
const router = express.Router();
const auth = require('../middleware/logMiddleware.js');
const { updateUsuario } = require('../controllers/logController');


router.get('/dashboard', auth, (req, res) => {
    res.json({ message: 'Acceso permitido', user: req.user });
});

router.get('/users', getUsers);
router.post('/login', login);
router.post('/register', register);
router.put('/update', auth, updateUsuario);

module.exports = router;