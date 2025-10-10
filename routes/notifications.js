// routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

// جميع المسارات تتطلب مصادقة
router.use(auth);

// الحصول على إشعارات المستخدم
router.get('/', notificationController.getUserNotifications);

// الحصول على إحصائيات الإشعارات
router.get('/stats', notificationController.getNotificationStats);

// تحديث الإشعار كمقروء
router.patch('/:id/read', notificationController.markAsRead);

// تحديد الكل كمقروء
router.patch('/read-all', notificationController.markAllAsRead);

// حذف إشعار
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;