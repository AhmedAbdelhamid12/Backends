const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceNewController');
const { auth, authorize } = require('../middleware/authNew');

router.get('/', serviceController.getServices);

// Admin routes
router.post('/', auth, authorize('admin'), serviceController.createService);

module.exports = router;