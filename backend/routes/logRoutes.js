const express = require('express');
const { login, register, getUsers } = require('../controllers/logController');
const router = express.Router();
const auth = require('../middleware/logMiddleware.js');
const isAdmin = require('../middleware/isAdmin');
const { updateMe, updateUsuario, deleteUsuario } = require('../controllers/logController');


router.put('/updateMe', auth, updateMe);
router.put('/updateUser/:id', auth, isAdmin, updateUsuario);
router.delete('/deleteUser/:id', auth, isAdmin, deleteUsuario);


router.get('/dashboard', auth, (req, res) => {
    res.json({ message: 'Acceso permitido', user: req.user });
});

router.get('/users', auth, isAdmin, getUsers);
router.post('/login', login);
router.post('/register', auth, isAdmin, register);

module.exports = router;