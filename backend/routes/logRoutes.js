const express = require('express');
const { login, register, getUsers } = require('../controllers/logController');
const router = express.Router();

router.get('/users', getUsers);
router.post('/login', login);
router.post('/register', register);

module.exports = router;