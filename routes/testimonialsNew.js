const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialNewController');
const { auth, authorize } = require('../middleware/authNew');

router.get('/', testimonialController.getTestimonials);

// Admin routes
router.post('/', auth, authorize('admin'), testimonialController.createTestimonial);

module.exports = router;