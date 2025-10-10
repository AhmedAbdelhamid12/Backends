const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع المدفوعات (للأدمن)
router.get('/', authorize('admin'), paymentController.getPayments);

// مدفوعات المستخدم الحالي
router.get('/me', paymentController.getMyPayments);
router.get('/my-payments', paymentController.getMyPayments);

// دفعة واحدة
router.get('/:id', paymentController.getPaymentById);

// إنشاء دفعة وتحديث حالتها (للأدمن)
router.post('/', authorize('admin'), paymentController.createPayment);
router.patch('/:id/status', authorize('admin'), paymentController.updatePaymentStatus);

module.exports = router;

