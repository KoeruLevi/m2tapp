const express = require('express');
const auth = require('../middleware/logMiddleware');
const ctl = require('../controllers/ticketController');

const router = express.Router();

router.get('/users-lite', auth, ctl.usersLite);

router.get('/', auth, ctl.list);
router.post('/', auth, ctl.create);

router.put('/:id/done', auth, ctl.markDone);
router.put('/:id/close', auth, ctl.closeManual);
router.put('/:id/reopen', auth, ctl.reopen);

router.delete('/:id', auth, ctl.remove);

module.exports = router;