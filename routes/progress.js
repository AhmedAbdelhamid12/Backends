// routes/progress.js
const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { auth, authorize } = require('../middleware/auth');

// جميع المسارات تتطلب مصادقة
router.use(auth);

// الحصول على سجل التقدم (الجميع يمكنهم الوصول مع قيود)
router.get('/', progressController.getProgressHistory);
router.get('/stats', progressController.getProgressStats);
router.get('/report/:subscriberId', progressController.getComprehensiveReport);

// إنشاء سجل تقدم جديد (للأدمن والمدرب)
router.post('/', authorize('admin', 'trainer'), progressController.recordProgress);

// الحصول على تقدم محدد
router.get('/:id', progressController.getProgressById);

// تحديث سجل التقدم (للأدمن والمدرب)
router.put('/:id', authorize('admin', 'trainer'), progressController.updateProgress);

// تحديث حالة الهدف (للأدمن والمدرب)
router.patch('/:id/goals/:goalType/:goalIndex', authorize('admin', 'trainer'), progressController.updateGoalStatus);

module.exports = router;