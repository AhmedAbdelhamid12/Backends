// routes/trainingSessions.js
const express = require('express');
const router = express.Router();
const trainingSessionController = require('../controllers/trainingSessionController');
const { auth, authorize } = require('../middleware/auth');

// جميع المسارات تتطلب مصادقة
router.use(auth);

// الحصول على الجلسات (الجميع يمكنهم الوصول مع قيود)
router.get('/', trainingSessionController.getAllSessions);
router.get('/my-sessions', trainingSessionController.getAllSessions);
router.get('/upcoming', trainingSessionController.getUpcomingSessions);
router.get('/stats', trainingSessionController.getSessionStats);

// إنشاء جلسة جديدة (للأدمن والمدرب)
router.post('/', authorize('admin', 'coach'), trainingSessionController.createSession);

// الحصول على جلسة محددة
router.get('/:id', trainingSessionController.getSessionById);

// تحديث الجلسة (للأدمن والمدرب لجلساتهم)
router.put('/:id', authorize('admin', 'coach'), trainingSessionController.updateSession);

// تحديث حالة الجلسة (للأدمن والمدرب)
router.patch('/:id/status', authorize('admin', 'coach'), trainingSessionController.updateSessionStatus);

// تسجيل تقدم الجلسة (للمدرب فقط)
router.patch('/:id/progress', authorize('coach'), trainingSessionController.recordSessionProgress);

// تقييم الجلسة
router.patch('/:id/rate', trainingSessionController.rateSession);

module.exports = router;