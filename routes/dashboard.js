// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

// جميع المسارات تتطلب مصادقة
router.use(auth);

// الحصول على إحصائيات لوحة التحكم
router.get('/stats', dashboardController.getDashboardStats);
router.get('/admin', dashboardController.getDashboardStats);
router.get('/coach', dashboardController.getDashboardStats);
router.get('/trainee', dashboardController.getDashboardStats);
router.get('/parent', dashboardController.getDashboardStats);

module.exports = router;

