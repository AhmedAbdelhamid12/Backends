const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentNewController');
const { auth, authorize } = require('../middleware/authNew');

router.get('/', auth, enrollmentController.getEnrollments);
router.post('/', auth, enrollmentController.createEnrollment);

module.exports = router;