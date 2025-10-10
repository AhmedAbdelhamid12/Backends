const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع المسارات
router.get('/', courseController.getAllCourses);
router.get('/available', courseController.getAvailableCourses);
router.get('/stats', authorize('admin'), courseController.getCourseStats);
router.get('/:id', courseController.getCourseById);

// إنشاء وتحديث (للأدمن والمدرب)
router.post('/', authorize('admin', 'coach'), courseController.createCourse);
router.put('/:id', authorize('admin', 'coach'), courseController.updateCourse);

// التسجيل والتقدم
router.post('/:courseId/enroll', courseController.enrollInCourse);
router.put('/:courseId/progress/:userId', authorize('admin', 'coach'), courseController.updateProgress);

module.exports = router;

