const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع المسارات
router.get('/', attendanceController.getAllAttendance);
router.get('/user/:userId', attendanceController.getUserAttendance);
router.get('/session/:sessionId', attendanceController.getSessionAttendance);
router.get('/stats/:userId', attendanceController.getAttendanceStats);

// تسجيل وتحديث الحضور
router.post('/', authorize('admin', 'coach'), attendanceController.markAttendance);
router.put('/:id', authorize('admin', 'coach'), attendanceController.updateAttendance);
router.post('/:id/approve-excuse', authorize('admin', 'coach'), attendanceController.approveExcuse);

module.exports = router;

