const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsNewController');
const { auth } = require('../middleware/authNew');

router.get('/overview', auth, statsController.getOverview);

module.exports = router;