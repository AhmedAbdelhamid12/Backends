// routes/subscriptions.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { auth, authorize } = require('../middleware/auth');

// جميع المسارات تتطلب مصادقة
router.use(auth);

// الحصول على الاشتراكات (الجميع يمكنهم الوصول مع قيود)
router.get('/', subscriptionController.getAllSubscriptions);
router.get('/expiring', subscriptionController.getExpiringSubscriptions);

// الإحصائيات (للأدمن فقط)
router.get('/stats', authorize('admin'), subscriptionController.getSubscriptionStats);

// إنشاء اشتراك جديد (للأدمن والمدرب)
router.post('/', authorize('admin', 'trainer'), subscriptionController.createSubscription);

// الحصول على اشتراك محدد
router.get('/:id', subscriptionController.getSubscriptionById);

// تحديث الاشتراك (للأدمن والمدرب لاشتراكاتهم)
router.put('/:id', authorize('admin', 'trainer'), subscriptionController.updateSubscription);

// تجديد الاشتراك (للأدمن والمدرب)
router.post('/:id/renew', authorize('admin', 'trainer'), subscriptionController.renewSubscription);

// تحديث حالة الدفع (للأدمن فقط)
router.patch('/:id/payment', authorize('admin'), subscriptionController.updatePaymentStatus);

module.exports = router;