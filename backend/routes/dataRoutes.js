const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const { searchData } = require('../controllers/dataController');

router.get('/search', searchData);
router.get('/suggestions', dataController.getSuggestions);

module.exports = router;

