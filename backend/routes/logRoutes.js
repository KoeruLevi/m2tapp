const express = require('express');
const { login, register, getUsers } = require('../controllers/logController');
const router = express.Router();
const auth = require('../middlewares/auth');

router.get('/dashboard', auth, (req, res) => {
    res.json({ message: 'Acceso permitido', user: req.user });
});

router.get('/users', getUsers);
router.post('/login', login);
router.post('/register', register);

module.exports = router;