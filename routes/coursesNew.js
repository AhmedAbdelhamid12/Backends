const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseNewController');
const { auth, authorize } = require('../middleware/authNew');

router.get('/', courseController.getCourses);
router.get('/:slug', courseController.getCourseBySlug);

// Admin routes
router.post('/', auth, authorize('admin'), courseController.createCourse);
router.patch('/:id', auth, authorize('admin'), courseController.updateCourse);

module.exports = router;