const express = require('express');
const router = express.Router();
const userController = require('../controllers/userNewController');
const { auth } = require('../middleware/authNew');

router.get('/me', auth, userController.getMe);
router.patch('/me', auth, userController.updateMe);

module.exports = router;